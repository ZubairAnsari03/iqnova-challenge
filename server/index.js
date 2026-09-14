import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import PDFDocument from "pdfkit";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5174").replace(/\/$/, "");
const AMOUNT_PAISE = 1900;
const CURRENCY = "INR";

const ANSWERS = [
  1, 2, 1, 2, 2,
  2, 1, 3, 0, 1,
  2, 2, 0, 2, 1,
  2, 1, 1, 2
];
const WEIGHTS = [2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 10, 10, 10, 10];

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function requireConfig() {
  const required = [
    ["RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID],
    ["RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET],
    ["RAZORPAY_WEBHOOK_SECRET", process.env.RAZORPAY_WEBHOOK_SECRET],
    ["SUPABASE_URL", process.env.SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

function performanceFromScore(score) {
  if (score <= 20) return "Very Slow / Beginner";
  if (score <= 40) return "Developing";
  if (score <= 60) return "Average";
  if (score <= 80) return "High";
  return "Exceptional";
}

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function makeCertificateId() {
  const year = new Date().getFullYear();
  return `IQN-${year}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function safeName(name) {
  return String(name || "Student")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .trim()
    .slice(0, 80) || "Student";
}

function buildReview(answers) {
  return ANSWERS.map((correctAnswer, index) => {
    const selected = Number.isInteger(answers?.[index])
      ? answers[index]
      : answers?.[String(index)] !== undefined
        ? Number(answers[String(index)])
        : null;

    return {
      question: index + 1,
      selectedAnswer: selected,
      correctAnswer,
      correct: selected === correctAnswer,
      points: selected === correctAnswer ? WEIGHTS[index] : 0,
      maxPoints: WEIGHTS[index],
      difficulty:
        index < 5
          ? "Easy"
          : index < 10
            ? "Hard"
            : index < 15
              ? "Very Hard"
              : "Extreme",
    };
  });
}

function calculateResult(session, answers) {
  const review = buildReview(answers);
  const score = review.reduce((sum, item) => sum + item.points, 0);
  const correctCount = review.filter((item) => item.correct).length;

  const startedAt = new Date(session.started_at).getTime();
  const completedAt = Date.now();
  const elapsedMs = Math.max(0, completedAt - startedAt);

  return {
    score,
    correctCount,
    totalQuestions: 19,
    performance: performanceFromScore(score),
    elapsedMs,
    formattedTime: formatElapsed(elapsedMs),
    review,
  };
}

async function getSession(sessionId) {
  const { data, error } = await supabase
    .from("challenge_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function createOrGetPaymentLink(session) {
  // 1. DB mein payment link already saved hai
  if (session.payment_link_id && session.payment_link_url) {
    return {
      id: session.payment_link_id,
      short_url: session.payment_link_url,
      status: session.paid_at ? "paid" : "created",
    };
  }

  // 2. Razorpay API se existing Payment Link direct find karo
  async function findExistingPaymentLink() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    try {
      const url =
        `https://api.razorpay.com/v1/payment_links` +
        `?reference_id=${encodeURIComponent(session.session_id)}` +
        `&count=100`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(
          "Razorpay existing-link lookup failed:",
          response.status,
          text
        );
        return null;
      }

      const data = await response.json();

      const links = data?.items || data?.payment_links || [];

      const match = links.find(
        (item) => item.reference_id === session.session_id
      );

      if (match) {
        return match;
      }

      return null;
    } catch (error) {
      console.warn(
        "Razorpay direct lookup error:",
        error?.message || error
      );
      return null;
    }
  }

  // 3. Create karne se pehle existing link check
  const existingLink = await findExistingPaymentLink();

  if (existingLink) {
    await supabase
      .from("challenge_sessions")
      .update({
        payment_link_id: existingLink.id,
        payment_link_url: existingLink.short_url,
      })
      .eq("session_id", session.session_id);

    return existingLink;
  }

  // 4. Existing link nahi mila to create karo
  try {
    const link = await razorpay.paymentLink.create({
      amount: AMOUNT_PAISE,
      currency: CURRENCY,
      accept_partial: false,
      reference_id: session.session_id,
      description: "IQNova Full Result & Certificate",

      customer: {
        name: session.name,
        email: session.email,
      },

      notify: {
        email: false,
        sms: false,
        whatsapp: false,
      },

      reminder_enable: false,

      callback_url: `${FRONTEND_URL}/?payment=success&sessionId=${encodeURIComponent(
        session.session_id
      )}`,

      callback_method: "get",

      notes: {
        product: "IQNova IQ Challenge",
        session_id: session.session_id,
      },
    });

    await supabase
      .from("challenge_sessions")
      .update({
        payment_link_id: link.id,
        payment_link_url: link.short_url,
      })
      .eq("session_id", session.session_id);

    return link;
  } catch (error) {
    // 5. Agar Razorpay bole reference_id already exists,
    // existing link ko direct API se recover karo
    const description = String(
      error?.description || ""
    ).toLowerCase();

    if (
      error?.code === "BAD_REQUEST_ERROR" &&
      description.includes("reference") &&
      description.includes("already")
    ) {
      const recoveredLink = await findExistingPaymentLink();

      if (recoveredLink) {
        await supabase
          .from("challenge_sessions")
          .update({
            payment_link_id: recoveredLink.id,
            payment_link_url: recoveredLink.short_url,
          })
          .eq("session_id", session.session_id);

        return recoveredLink;
      }
    }

    throw error;
  }
}

async function sendEmail({ to, subject, html, attachments }) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is missing.");
    return { skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: [to],
    subject,
    html,
    attachments,
  });

  if (error) throw new Error(error.message || "Email send failed");
  return data;
}

async function sendPaymentReminderEmail(session, paymentLink) {
  if (session.payment_email_sent_at) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px">
      <h1 style="color:#102a56">IQNova — IQ Challenge</h1>
      <p>Hi ${safeName(session.name)},</p>
      <p>You have completed all 19 questions of your IQNova educational challenge.</p>
      <p>Your result is ready. Pay the one-time <strong>₹19</strong> unlock fee to see your full score, detailed analysis, answer review and certificate.</p>
      <p style="margin:28px 0">
        <a href="${paymentLink.short_url}" style="background:#102a56;color:white;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold">
          Complete Payment & View Result
        </a>
      </p>
      <p style="color:#666;font-size:13px">IQNova is an educational intelligence challenge and is not a clinically validated IQ assessment.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: session.email,
      subject: "IQNova — Complete your test & unlock your result for ₹19",
      html,
    });

    await supabase
      .from("challenge_sessions")
      .update({ payment_email_sent_at: new Date().toISOString() })
      .eq("session_id", session.session_id);
  } catch (error) {
    console.error("Payment reminder email failed:", error.message);
  }
}

function createCertificatePdf({
  name,
  score,
  performance,
  certificateId,
  completedAt,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      info: {
        Title: "IQNova — Certificate of Achievement",
        Author: "IQNova",
        Subject: "IQNova IQ Challenge Certificate",
      },
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // =========================
    // LUXURY PALETTE
    // =========================
    const NAVY = "#071A33";
    const NAVY2 = "#102A4A";
    const NAVY3 = "#183B61";

    const CREAM = "#F7F2E7";
    const CREAM2 = "#FCF9F1";

    const GOLD = "#B88A2A";
    const GOLD2 = "#D7B866";
    const GOLD3 = "#E8D39A";

    const WHITE = "#FFFFFF";
    const TEXT = "#263342";
    const MUTED = "#697384";

    // =========================
    // BACKGROUND
    // =========================
    doc.rect(0, 0, W, H).fill(CREAM);

    // Soft inner background
    doc.rect(28, 28, W - 56, H - 56).fill(CREAM2);

    // =========================
    // LUXURY FRAMES
    // =========================
    doc
      .lineWidth(15)
      .strokeColor(NAVY)
      .rect(15, 15, W - 30, H - 30)
      .stroke();

    doc
      .lineWidth(2.2)
      .strokeColor(GOLD)
      .rect(34, 34, W - 68, H - 68)
      .stroke();

    doc
      .lineWidth(0.8)
      .strokeColor(GOLD3)
      .rect(42, 42, W - 84, H - 84)
      .stroke();

    // =========================
    // DECORATIVE CORNERS
    // =========================
    const drawCorner = (x, y, sx, sy) => {
      doc.save();
      doc.translate(x, y);
      doc.scale(sx, sy);

      doc
        .lineWidth(2.2)
        .strokeColor(GOLD)
        .moveTo(0, 38)
        .lineTo(0, 0)
        .lineTo(38, 0)
        .stroke();

      doc
        .lineWidth(0.9)
        .strokeColor(GOLD2)
        .moveTo(8, 29)
        .lineTo(8, 8)
        .lineTo(29, 8)
        .stroke();

      doc.restore();
    };

    drawCorner(50, 50, 1, 1);
    drawCorner(W - 50, 50, -1, 1);
    drawCorner(50, H - 50, 1, -1);
    drawCorner(W - 50, H - 50, -1, -1);

    // =========================
    // TOP BRAND
    // =========================
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(GOLD)
      .text("IQNOVA", 0, 67, {
        width: W,
        align: "center",
        characterSpacing: 4,
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(NAVY2)
      .text("IQ CHALLENGE", 0, 88, {
        width: W,
        align: "center",
        characterSpacing: 3,
        lineBreak: false,
      });

    // =========================
    // TITLE
    // =========================
    doc
      .font("Helvetica-Bold")
      .fontSize(29)
      .fillColor(NAVY)
      .text("CERTIFICATE OF ACHIEVEMENT", 0, 119, {
        width: W,
        align: "center",
        lineBreak: false,
      });

    // Gold divider
    doc
      .lineWidth(1.5)
      .strokeColor(GOLD)
      .moveTo(W / 2 - 105, 158)
      .lineTo(W / 2 + 105, 158)
      .stroke();

    // Small diamond
    doc
      .circle(W / 2, 158, 3)
      .fill(GOLD);

    // =========================
    // PRESENTED TO
    // =========================
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(MUTED)
      .text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 0, 177, {
        width: W,
        align: "center",
        characterSpacing: 1.2,
        lineBreak: false,
      });

    // =========================
    // STUDENT NAME
    // =========================
    const studentName = String(name || "Participant").trim();

    // Keep long names inside safe area
    let nameSize = 28;

    if (studentName.length > 26) nameSize = 24;
    if (studentName.length > 34) nameSize = 20;

    doc
      .font("Helvetica-Bold")
      .fontSize(nameSize)
      .fillColor(NAVY)
      .text(studentName, 70, 201, {
        width: W - 140,
        height: 38,
        align: "center",
        lineBreak: false,
        ellipsis: true,
      });

    // Name underline
    doc
      .lineWidth(1)
      .strokeColor(GOLD2)
      .moveTo(W / 2 - 135, 244)
      .lineTo(W / 2 + 135, 244)
      .stroke();

    // =========================
    // ACHIEVEMENT TEXT
    // =========================
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(
        "for successfully completing the IQNova educational IQ Challenge",
        0,
        258,
        {
          width: W,
          align: "center",
          lineBreak: false,
        }
      );

    // =========================
    // PREMIUM RESULT CARDS
    // =========================
    const cardY = 294;
    const cardW = 150;
    const cardH = 76;
    const gap = 18;

    const totalW = cardW * 3 + gap * 2;
    const startX = (W - totalW) / 2;

    const drawLuxuryCard = (x, label, value, valueSize = 18) => {
      // Shadow
      doc
        .roundedRect(x + 3, cardY + 4, cardW, cardH, 9)
        .fill("#D9D2C2");

      // Main card
      doc
        .roundedRect(x, cardY, cardW, cardH, 9)
        .fill(WHITE);

      // Gold border
      doc
        .lineWidth(1.1)
        .strokeColor(GOLD2)
        .roundedRect(x, cardY, cardW, cardH, 9)
        .stroke();

      // Small gold top line
      doc
        .lineWidth(2)
        .strokeColor(GOLD)
        .moveTo(x + 42, cardY + 1)
        .lineTo(x + cardW - 42, cardY + 1)
        .stroke();

      // Label
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(String(label).toUpperCase(), x + 8, cardY + 14, {
          width: cardW - 16,
          height: 12,
          align: "center",
          characterSpacing: 1.1,
          lineBreak: false,
        });

      // Value
      doc
        .font("Helvetica-Bold")
        .fontSize(valueSize)
        .fillColor(NAVY)
        .text(String(value || "—"), x + 8, cardY + 35, {
          width: cardW - 16,
          height: 27,
          align: "center",
          lineBreak: false,
          ellipsis: true,
        });
    };

    drawLuxuryCard(
      startX,
      "Challenge Score",
      `${Number(score) || 0}/100`,
      19
    );

    // Shortened performance display so it NEVER breaks the card
    const performanceDisplay =
      performance === "Very Slow / Beginner"
        ? "Beginner"
        : String(performance || "—");

    drawLuxuryCard(
      startX + cardW + gap,
      "Performance",
      performanceDisplay,
      performanceDisplay.length > 10 ? 14 : 17
    );

    drawLuxuryCard(
      startX + (cardW + gap) * 2,
      "Certificate ID",
      certificateId || "—",
      12
    );

    // =========================
    // COMPLETION DATE
    // =========================
    const dateText = completedAt
      ? new Date(completedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(`Completed on ${dateText}`, 0, 391, {
        width: W,
        align: "center",
        lineBreak: false,
      });

    // =========================
    // PREMIUM SEAL
    // =========================
    const sealX = W - 106;
    const sealY = H - 111;

    // Outer shadow
    doc
      .circle(sealX + 2, sealY + 2, 37)
      .fill("#D7D0C1");

    // Navy seal
    doc
      .circle(sealX, sealY, 36)
      .fill(NAVY);

    // Gold ring
    doc
      .lineWidth(2)
      .strokeColor(GOLD2)
      .circle(sealX, sealY, 30)
      .stroke();

    // Inner ring
    doc
      .lineWidth(0.7)
      .strokeColor(GOLD)
      .circle(sealX, sealY, 25)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(GOLD3)
      .text("IQNOVA", sealX - 25, sealY - 8, {
        width: 50,
        align: "center",
        characterSpacing: 1,
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(5.2)
      .fillColor(WHITE)
      .text("ACHIEVEMENT", sealX - 28, sealY + 4, {
        width: 56,
        align: "center",
        lineBreak: false,
      });

    // =========================
    // VERIFICATION
    // =========================
    doc
      .font("Helvetica")
      .fontSize(7.2)
      .fillColor(MUTED)
      .text(
        "Certificate verification available through the IQNova certificate portal",
        55,
        H - 91,
        {
          width: W - 110,
          align: "center",
          lineBreak: false,
        }
      );

    // =========================
    // DISCLAIMER
    // =========================
    doc
      .font("Helvetica")
      .fontSize(6.3)
      .fillColor("#777777")
      .text(
        "This certificate represents performance in the IQNova educational challenge and is not a clinically validated IQ assessment.",
        55,
        H - 68,
        {
          width: W - 110,
          height: 10,
          align: "center",
          lineBreak: false,
        }
      );

    // =========================
    // BOTTOM GOLD ACCENT
    // =========================
    doc
      .lineWidth(2)
      .strokeColor(GOLD)
      .moveTo(W / 2 - 55, H - 49)
      .lineTo(W / 2 + 55, H - 49)
      .stroke();

    // Finalize
    doc.end();
  });
}

async function sendCertificateEmail(session) {
  if (session.certificate_email_sent_at) return;

  const pdf = await createCertificatePdf(session);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px">
      <h1 style="color:#102a56">Congratulations, ${safeName(session.name)} 🎉</h1>
      <p>Your IQNova challenge payment has been verified and your Certificate of Achievement is attached to this email.</p>
      <p><strong>Score:</strong> ${session.result.score}/100</p>
      <p><strong>Performance:</strong> ${session.result.performance}</p>
      <p><strong>Certificate ID:</strong> ${session.certificate_id}</p>
      <p style="color:#666;font-size:13px">Keep your Certificate ID for verification.</p>
    </div>
  `;

  await sendEmail({
    to: session.email,
    subject: "IQNova — Your Certificate of Achievement",
    html,
    attachments: [
      {
        filename: `IQNova-Certificate-${session.certificate_id}.pdf`,
        content: pdf.toString("base64"),
      },
    ],
  });

  await supabase
    .from("challenge_sessions")
    .update({ certificate_email_sent_at: new Date().toISOString() })
    .eq("session_id", session.session_id);
}

async function markPaidAndFinalize(sessionId, paymentLinkId, paymentId = null) {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  if (!session.completed_at || !session.result) {
    throw new Error("Challenge is not completed");
  }

  const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId || session.payment_link_id);

  if (
    paymentLink.status !== "paid" ||
    Number(paymentLink.amount) !== AMOUNT_PAISE ||
    paymentLink.currency !== CURRENCY ||
    paymentLink.reference_id !== session.session_id
  ) {
    throw new Error("Payment verification failed");
  }

  const update = {
    paid_at: session.paid_at || new Date().toISOString(),
    razorpay_payment_link_id: paymentLink.id,
    razorpay_payment_id: paymentId || session.razorpay_payment_id || null,
    certificate_id: session.certificate_id || makeCertificateId(),
  };

  await supabase
    .from("challenge_sessions")
    .update(update)
    .eq("session_id", sessionId);

  const fresh = await getSession(sessionId);

  // Email is idempotent using certificate_email_sent_at.
  try {
    await sendCertificateEmail(fresh);
  } catch (error) {
    console.error("Certificate email failed:", error.message);
  }

  return fresh;
}

requireConfig();

app.get("/api/health", async (_req, res) => {
  res.json({
    success: true,
    service: "IQNova API",
    database: true,
    email: Boolean(resend && process.env.RESEND_FROM_EMAIL),
  });
});

// IMPORTANT: Razorpay webhook must receive the raw body.
app.post(
  "/api/challenge/razorpay-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
        return res.status(400).send("Missing webhook signature");
      }

      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex");

      if (
        expected.length !== signature.length ||
        !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
      ) {
        return res.status(400).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString("utf8"));

      if (event.event === "payment_link.paid") {
        const link = event.payload?.payment_link?.entity;
        const payment = event.payload?.payment?.entity;

        if (!link?.reference_id) {
          return res.status(200).json({ received: true });
        }

        if (
          Number(link.amount) !== AMOUNT_PAISE ||
          link.currency !== CURRENCY ||
          link.status !== "paid"
        ) {
          return res.status(400).send("Invalid payment");
        }

        await markPaidAndFinalize(
          link.reference_id,
          link.id,
          payment?.id || null
        );
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).send("Webhook processing failed");
    }
  }
);

app.use(cors({
  origin: true,
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "1mb" }));

app.post("/api/challenge/start", async (req, res) => {
  try {
    const { sessionId, name, age, email } = req.body;

    if (!sessionId || !name || !age || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, age, email and sessionId are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existing } = await supabase
      .from("challenge_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, sessionId });
    }

    const { error } = await supabase
      .from("challenge_sessions")
      .insert({
        session_id: sessionId,
        name: String(name).trim(),
        age: Number(age),
        email: normalizedEmail,
        started_at: new Date().toISOString(),
      });

    if (error) throw error;

    res.json({ success: true, sessionId });
  } catch (error) {
    console.error("Start error:", error);
    res.status(500).json({ success: false, message: "Challenge start failed." });
  }
});

app.post("/api/challenge/complete", async (req, res) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({
        success: false,
        message: "Session ID and answers are required.",
      });
    }

    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (session.completed_at && session.result) {
      const paymentLink = await createOrGetPaymentLink(session);
      await sendPaymentReminderEmail(session, paymentLink);

      return res.json({
        success: true,
        completed: true,
        paid: Boolean(session.paid_at),
        paymentUrl: paymentLink.short_url,
      });
    }

    const result = calculateResult(session, answers);

    const { error } = await supabase
      .from("challenge_sessions")
      .update({
        answers,
        result,
        score: result.score,
        correct_count: result.correctCount,
        performance: result.performance,
        elapsed_ms: result.elapsedMs,
        formatted_time: result.formattedTime,
        completed_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId);

    if (error) throw error;

    const completedSession = await getSession(sessionId);
    const paymentLink = await createOrGetPaymentLink(completedSession);

    // The email is sent as soon as the ₹19 unlock option is available.
    await sendPaymentReminderEmail(completedSession, paymentLink);

    res.json({
      success: true,
      completed: true,
      paid: false,
      paymentUrl: paymentLink.short_url,
    });
  } catch (error) {
    console.error("Complete error:", error);
    res.status(500).json({
      success: false,
      message: "Result calculation failed.",
    });
  }
});

app.post("/api/payment/create", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (!session.completed_at) {
      return res.status(400).json({
        success: false,
        message: "Complete the challenge first.",
      });
    }

    const link = await createOrGetPaymentLink(session);

    res.json({
      success: true,
      shortUrl: link.short_url,
      paymentLinkId: link.id,
      paid: Boolean(session.paid_at),
    });
  } catch (error) {
    console.error("Payment create error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment link create failed.",
    });
  }
});

app.get("/api/payment/status/:sessionId", async (req, res) => {
  try {
    let session = await getSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (!session.paid_at && session.payment_link_id) {
      try {
        const link = await razorpay.paymentLink.fetch(session.payment_link_id);

        if (
          link.status === "paid" &&
          Number(link.amount) === AMOUNT_PAISE &&
          link.currency === CURRENCY &&
          link.reference_id === session.session_id
        ) {
          session = await markPaidAndFinalize(
            session.session_id,
            link.id,
            link.payments?.[0]?.payment_id || null
          );
        }
      } catch (error) {
        console.error("Razorpay status sync error:", error.message);
      }
    }

    res.json({
      success: true,
      paid: Boolean(session.paid_at),
      certificateId: session.certificate_id || null,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Payment status check failed.",
    });
  }
});

app.get("/api/challenge/result/:sessionId", async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (!session.paid_at) {
      return res.status(402).json({
        success: false,
        paid: false,
        message: "Payment required.",
      });
    }

    res.json({
      success: true,
      paid: true,
      result: {
        score: session.score,
        correctCount: session.correct_count,
        totalQuestions: 19,
        performance: session.performance,
        formattedTime: session.formatted_time,
        review: session.result?.review || [],
        certificateId: session.certificate_id,
      },
    });
  } catch (error) {
    console.error("Result error:", error);
    res.status(500).json({
      success: false,
      message: "Result load failed.",
    });
  }
});

app.get("/api/certificate/:certificateId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("challenge_sessions")
      .select("name,score,performance,formatted_time,completed_at,certificate_id,paid_at")
      .eq("certificate_id", req.params.certificateId)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.paid_at || !data.certificate_id) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: "Certificate not found.",
      });
    }

    res.json({
      success: true,
      verified: true,
      certificate: {
        certificateId: data.certificate_id,
        name: data.name,
        score: data.score,
        performance: data.performance,
        completionTime: data.formatted_time,
        completionDate: data.completed_at,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    res.status(500).json({
      success: false,
      verified: false,
      message: "Certificate verification failed.",
    });
  }
});

app.get("/api/certificate/:certificateId/pdf", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("challenge_sessions")
      .select("*")
      .eq("certificate_id", req.params.certificateId)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.paid_at || !data.certificate_id) {
      return res.status(404).send("Certificate not found");
    }

    const pdf = await createCertificatePdf(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="IQNova-Certificate-${data.certificate_id}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Certificate PDF error:", error);
    res.status(500).send("Certificate PDF generation failed");
  }
});

// Useful for an already-paid payment link created before the database migration.
// It is intentionally limited to a session the user already owns.
app.post("/api/payment/recover", async (req, res) => {
  try {
    const { sessionId, name, age, email, answers } = req.body;

    if (!sessionId || !name || !age || !email) {
      return res.status(400).json({
        success: false,
        message: "Session ID, name, age and email are required.",
      });
    }

    let session = await getSession(sessionId);

    if (!session) {
      const { error } = await supabase
        .from("challenge_sessions")
        .insert({
          session_id: sessionId,
          name: String(name).trim(),
          age: Number(age),
          email: String(email).trim().toLowerCase(),
          started_at: new Date().toISOString(),
          answers: answers || {},
        });

      if (error) throw error;
      session = await getSession(sessionId);
    }

    const links = await razorpay.paymentLink.all({
      reference_id: sessionId,
    });

    const link = links?.payment_links?.[0];

    if (!link || link.status !== "paid") {
      return res.status(402).json({
        success: false,
        message: "No verified paid link found for this session.",
      });
    }

    if (
      Number(link.amount) !== AMOUNT_PAISE ||
      link.currency !== CURRENCY ||
      link.reference_id !== sessionId
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }

    if (!session.completed_at) {
      if (!answers) {
        return res.status(400).json({
          success: false,
          message: "Answers are required to recover the result.",
        });
      }

      const result = calculateResult(session, answers);

      await supabase
        .from("challenge_sessions")
        .update({
          answers,
          result,
          score: result.score,
          correct_count: result.correctCount,
          performance: result.performance,
          elapsed_ms: result.elapsedMs,
          formatted_time: result.formattedTime,
          completed_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId);
    }

    const fresh = await markPaidAndFinalize(
      sessionId,
      link.id,
      link.payments?.[0]?.payment_id || null
    );

    res.json({
      success: true,
      paid: true,
      result: {
        score: fresh.score,
        correctCount: fresh.correct_count,
        totalQuestions: 19,
        performance: fresh.performance,
        formattedTime: fresh.formatted_time,
        review: fresh.result?.review || [],
        certificateId: fresh.certificate_id,
      },
    });
  } catch (error) {
    console.error("Recovery error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment recovery failed.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`IQNova server running on port ${PORT}`);
});