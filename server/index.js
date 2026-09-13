import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(cors());

/* =========================
   IQNOVA ANSWER KEY
========================= */

const ANSWERS = [
  2, 1, 0, 1, 1,
  2, 1, 0, 2, 2,
  2, 0, 2, 2, 0,
  1, 1, 3, 2
];

const WEIGHTS = [
  2, 2, 2, 2, 2,
  4, 4, 4, 4, 4,
  6, 6, 6, 6, 6,
  10, 10, 10, 10
];

/* Temporary session storage */
const sessions = new Map();

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "IQNova server is running"
  });
});

/* =========================
   START CHALLENGE
========================= */

app.post(
  "/api/challenge/start",
  express.json(),
  (req, res) => {
    try {
      const {
        sessionId,
        name,
        age,
        email
      } = req.body;

      if (!sessionId || !name || !age || !email) {
        return res.status(400).json({
          success: false,
          message:
            "sessionId, name, age and email are required"
        });
      }

      const startedAt = new Date().toISOString();

      sessions.set(sessionId, {
        sessionId,
        name: String(name).trim(),
        age: String(age).trim(),
        email: String(email)
          .trim()
          .toLowerCase(),

        startedAt,
        completedAt: null,
        elapsedSeconds: null,

        answers: null,
        result: null,

        completed: false,
        paid: false,

        paymentLinkId: null
      });

      res.json({
        success: true,
        sessionId,
        startedAt
      });
    } catch (error) {
      console.error(
        "Challenge start error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Could not start challenge"
      });
    }
  }
);

/* =========================
   COMPLETE CHALLENGE
========================= */

app.post(
  "/api/challenge/complete",
  express.json(),
  (req, res) => {
    try {
      const {
        sessionId,
        answers
      } = req.body;

      if (
        !sessionId ||
        !answers ||
        typeof answers !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "sessionId and answers are required"
        });
      }

      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }

      /* Don't calculate twice */
      if (
        session.completed &&
        session.result
      ) {
        return res.json({
          success: true,
          ...session.result
        });
      }

      const completedAt =
        new Date().toISOString();

      const elapsedSeconds = Math.max(
        0,
        Math.round(
          (
            new Date(completedAt).getTime() -
            new Date(session.startedAt).getTime()
          ) / 1000
        )
      );

      let score = 0;
      let correctCount = 0;

      const review = [];

      for (
        let i = 0;
        i < ANSWERS.length;
        i++
      ) {
        const selected =
          answers[i] === undefined ||
          answers[i] === null
            ? null
            : Number(answers[i]);

        const correct =
          selected === ANSWERS[i];

        const points = correct
          ? WEIGHTS[i]
          : 0;

        if (correct) {
          score += points;
          correctCount++;
        }

        review.push({
          question: i + 1,
          selected,
          correctAnswer: ANSWERS[i],
          correct,
          points,
          maxPoints: WEIGHTS[i]
        });
      }

      let performance =
        "Very Slow / Beginner";

      if (score >= 81) {
        performance = "Exceptional";
      } else if (score >= 61) {
        performance = "High";
      } else if (score >= 41) {
        performance = "Average";
      } else if (score >= 21) {
        performance = "Developing";
      }

      const minutes =
        Math.floor(elapsedSeconds / 60);

      const seconds =
        elapsedSeconds % 60;

      const formattedTime =
        minutes > 0
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`;

      const result = {
        sessionId,
        score,
        maxScore: 100,

        correctCount,
        totalQuestions: ANSWERS.length,

        elapsedSeconds,
        formattedTime,

        performance,

        review,

        completedAt
      };

      session.completedAt =
        completedAt;

      session.elapsedSeconds =
        elapsedSeconds;

      session.answers =
        answers;

      session.result =
        result;

      session.completed =
        true;

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error(
        "Challenge complete error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Could not calculate result"
      });
    }
  }
);

/* =========================
   GET CHALLENGE RESULT
========================= */

app.get(
  "/api/challenge/result/:sessionId",
  (req, res) => {
    try {
      const session =
        sessions.get(
          req.params.sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }

      if (
        !session.completed ||
        !session.result
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Challenge is not completed yet"
        });
      }

      res.json({
        success: true,
        paid: session.paid,
        result: session.result
      });
    } catch (error) {
      console.error(
        "Result fetch error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Could not fetch result"
      });
    }
  }
);

/* =========================
   CREATE RAZORPAY PAYMENT
========================= */

app.post(
  "/api/payment/create",
  express.json(),
  async (req, res) => {
    try {
      const {
        sessionId,
        name,
        email
      } = req.body;

      if (
        !sessionId ||
        !name ||
        !email
      ) {
        return res.status(400).json({
          success: false,
          message:
            "sessionId, name and email are required"
        });
      }

      const session =
        sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Challenge session not found"
        });
      }

      if (!session.completed) {
        return res.status(409).json({
          success: false,
          message:
            "Complete the challenge first"
        });
      }

      /* Existing payment link */
      if (session.paymentLinkId) {
        try {
          const existingLink =
            await razorpay.paymentLink.fetch(
              session.paymentLinkId
            );

          const paid =
            existingLink.status === "paid" ||
            existingLink.paid === true;

          if (paid) {
            session.paid = true;
          }

          return res.json({
            success: true,
            paymentLinkId:
              existingLink.id,
            shortUrl:
              existingLink.short_url,
            paid: session.paid
          });
        } catch (error) {
          console.log(
            "Existing link fetch failed."
          );
        }
      }

      /* Search Razorpay for same reference */
      try {
        const linksResponse =
          await razorpay.paymentLink.all({
            reference_id: sessionId,
            count: 10
          });

        const links =
          linksResponse?.items ||
          linksResponse?.payment_links ||
          [];

        const existingLink =
          links.find(
            (link) =>
              link.reference_id ===
              sessionId
          );

        if (existingLink) {
          const paid =
            existingLink.status === "paid" ||
            existingLink.paid === true;

          session.paymentLinkId =
            existingLink.id;

          session.paid = paid;

          return res.json({
            success: true,
            paymentLinkId:
              existingLink.id,
            shortUrl:
              existingLink.short_url,
            paid
          });
        }
      } catch (findError) {
        console.log(
          "Could not find existing link:",
          findError
        );
      }

      /* Create new unique link */
      const paymentLink =
        await razorpay.paymentLink.create({
          amount: 1900,
          currency: "INR",

          description:
            "IQNova Full Result & Certificate",

          reference_id: sessionId,

          customer: {
            name,
            email
          },

          notify: {
            email: true
          }
        });

      session.name =
        String(name).trim();

      session.email =
        String(email)
          .trim()
          .toLowerCase();

      session.paymentLinkId =
        paymentLink.id;

      session.paid = false;

      res.json({
        success: true,
        paymentLinkId:
          paymentLink.id,
        shortUrl:
          paymentLink.short_url,
        paid: false
      });
    } catch (error) {
      console.error(
        "Razorpay payment link error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Could not create payment link"
      });
    }
  }
);

/* =========================
   PAYMENT STATUS
========================= */

app.get(
  "/api/payment/status/:sessionId",
  async (req, res) => {
    try {
      const session =
        sessions.get(
          req.params.sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }

      if (!session.paymentLinkId) {
        return res.json({
          success: true,
          paid: false,
          status: "created"
        });
      }

      const paymentLink =
        await razorpay.paymentLink.fetch(
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
        status: paymentLink.status
      });
    } catch (error) {
      console.error(
        "Razorpay status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Could not check payment status"
      });
    }
  }
);

/* =========================
   RAZORPAY WEBHOOK
========================= */

app.post(
  "/api/challenge/razorpay-webhook",
  express.raw({
    type: "application/json"
  }),
  (req, res) => {
    try {
      const signature =
        req.headers[
          "x-razorpay-signature"
        ];

      if (!signature) {
        return res.status(400).json({
          success: false,
          message:
            "Missing Razorpay signature"
        });
      }

      const secret =
        process.env
          .RAZORPAY_WEBHOOK_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message:
            "Webhook secret is not configured"
        });
      }

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            secret
          )
          .update(req.body)
          .digest("hex");

      const received =
        Buffer.from(
          String(signature),
          "utf8"
        );

      const expected =
        Buffer.from(
          expectedSignature,
          "utf8"
        );

      if (
        received.length !==
          expected.length ||
        !crypto.timingSafeEqual(
          received,
          expected
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid webhook signature"
        });
      }

      const event =
        JSON.parse(
          req.body.toString()
        );

      if (
        event.event ===
        "payment_link.paid"
      ) {
        const paymentLinkEntity =
          event.payload
            ?.payment_link
            ?.entity;

        const paymentLinkId =
          paymentLinkEntity?.id;

        const referenceId =
          paymentLinkEntity
            ?.reference_id;

        if (
          paymentLinkId &&
          referenceId
        ) {
          const session =
            sessions.get(
              referenceId
            );

          if (
            session &&
            session.paymentLinkId ===
              paymentLinkId
          ) {
            session.paid = true;

            console.log(
              `Payment verified for session: ${referenceId}`
            );
          }
        }
      }

      return res.json({
        success: true
      });
    } catch (error) {
      console.error(
        "Webhook error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook processing failed"
      });
    }
  }
);

/* JSON parser AFTER webhook */
app.use(express.json());

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `IQNova server running on http://localhost:${PORT}`
  );
});