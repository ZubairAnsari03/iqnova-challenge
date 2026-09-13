import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
const PORT = 3001;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(cors());

// Temporary session store
const sessions = new Map();

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "IQNova server is running",
  });
});

// Create unique Razorpay Payment Link
app.post("/api/payment/create", express.json(), async (req, res) => {
  try {
    const { sessionId, name, email } = req.body;

    if (!sessionId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "sessionId, name and email are required",
      });
    }

    // If this session already has a payment link, reuse it.
    const existingSession = sessions.get(sessionId);

    if (existingSession?.paymentLinkId) {
      try {
        const existingLink = await razorpay.paymentLink.fetch(
          existingSession.paymentLinkId
        );

        return res.json({
          success: true,
          paymentLinkId: existingLink.id,
          shortUrl: existingLink.short_url,
        });
      } catch (error) {
        console.log("Existing payment link fetch failed, creating/finding again.");
      }
    }

    // Razorpay reference_id must be unique.
    // If a link was already created before a server restart,
    // find that existing link and reuse it.
    try {
      const linksResponse = await razorpay.paymentLink.all({
        reference_id: sessionId,
        count: 10,
      });

      const links =
        linksResponse?.items ||
        linksResponse?.payment_links ||
        [];

      const existingLink = links.find(
        (link) => link.reference_id === sessionId
      );

      if (existingLink) {
        sessions.set(sessionId, {
          sessionId,
          name,
          email,
          paymentLinkId: existingLink.id,
          paid: existingLink.status === "paid",
        });

        return res.json({
          success: true,
          paymentLinkId: existingLink.id,
          shortUrl: existingLink.short_url,
        });
      }
    } catch (findError) {
      console.log("Could not find existing Razorpay link:", findError);
    }

    // Create a new payment link only if one does not already exist.
    const paymentLink = await razorpay.paymentLink.create({
      amount: 1900,
      currency: "INR",
      description: "IQNova Full Result & Certificate",
      reference_id: sessionId,
      customer: {
        name,
        email,
      },
      notify: {
        email: true,
      },
    });

    sessions.set(sessionId, {
      sessionId,
      name,
      email,
      paymentLinkId: paymentLink.id,
      paid: false,
    });

    res.json({
      success: true,
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
    });
  } catch (error) {
    console.error("Razorpay payment link error:", error);

    res.status(500).json({
      success: false,
      message: "Could not create payment link",
    });
  }
});

// Check payment status
app.get("/api/payment/status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const paymentLink = await razorpay.paymentLink.fetch(
      session.paymentLinkId
    );

    const paid =
      paymentLink.status === "paid" ||
      paymentLink.paid === true;

    if (paid) {
      session.paid = true;
    }

    res.json({
      success: true,
      paid: session.paid,
      status: paymentLink.status,
    });
  } catch (error) {
    console.error("Razorpay status error:", error);

    res.status(500).json({
      success: false,
      message: "Could not check payment status",
    });
  }
});

// Razorpay webhook
app.post(
  "/api/challenge/razorpay-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];

      if (!signature) {
        return res.status(400).json({
          success: false,
          message: "Missing Razorpay signature",
        });
      }

      const expectedSignature = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(req.body)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }

      const event = JSON.parse(req.body.toString());

      if (event.event === "payment_link.paid") {
        const paymentLinkEntity =
          event.payload?.payment_link?.entity;

        const paymentLinkId = paymentLinkEntity?.id;
        const referenceId = paymentLinkEntity?.reference_id;

        if (paymentLinkId && referenceId) {
          const session = sessions.get(referenceId);

          if (
            session &&
            session.paymentLinkId === paymentLinkId
          ) {
            session.paid = true;

            console.log(
              `Payment verified for session: ${referenceId}`
            );
          }
        }
      }

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Webhook error:", error);

      return res.status(500).json({
        success: false,
        message: "Webhook processing failed",
      });
    }
  }
);

// JSON parser AFTER webhook route
app.use(express.json());

app.listen(PORT, () => {
  console.log(
    `IQNova server running on http://localhost:${PORT}`
  );
});