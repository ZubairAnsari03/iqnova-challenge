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

const ANSWERS = [2, 1, 0, 1, 1, 2, 1, 0, 2, 2, 2, 0, 2, 2, 0, 1, 1, 3, 2];
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
  if (session.payment_link_id && session.payment_link_url) {
    return {
      id: session.payment_link_id,
      short_url: session.payment_link_url,
      status: session.paid_at ? "paid" : "created",
    };
  }

  const existing = await razorpay.paymentLink.all({
    reference_id: session.session_id,
  });

  const existingLink = existing?.payment_links?.[0];

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
    callback_url: `${FRONTEND_URL}/?payment=success&sessionId=${encodeURIComponent(session.session_id)}`,
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

function createCertificatePdf(session) {
  return new Promise((resolve, reject) => {
    const result = session.result;
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: "IQNova Certificate of Achievement",
        Author: "IQNova",
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const navy = "#102A56";
    const gold = "#B28A4A";
    const cream = "#F8F4EA";
    const dark = "#182238";
    const light = "#E8E1D2";

    doc.rect(0, 0, 595.28, 841.89).fill(cream);
    doc.rect(22, 22, 551.28, 797.89).lineWidth(2).stroke(navy);
    doc.rect(31, 31, 533.28, 779.89).lineWidth(1).stroke(gold);

    doc.fillColor(navy).fontSize(14).font("Helvetica-Bold")
      .text("IQNOVA — IQ CHALLENGE", 0, 78, { align: "center" });

    doc.fillColor(gold).fontSize(12).font("Helvetica")
      .text("CERTIFICATE OF ACHIEVEMENT", 0, 125, { align: "center" });

    doc.fillColor(dark).fontSize(30).font("Helvetica-Bold")
      .text("Certificate of Achievement", 0, 165, { align: "center" });

    doc.fillColor("#666").fontSize(12).font("Helvetica")
      .text("This certificate is proudly presented to", 0, 225, { align: "center" });

    doc.fillColor(navy).fontSize(28).font("Helvetica-Bold")
      .text(safeName(session.name), 70, 260, {
        width: 455,
        align: "center",
      });

    doc.moveTo(150, 305).lineTo(445, 305).lineWidth(1).stroke(gold);

    doc.fillColor("#666").fontSize(12).font("Helvetica")
      .text("for completing the IQNova educational intelligence challenge", 0, 335, {
        align: "center",
      });

    const boxes = [
      ["SCORE", `${result.score} / 100`],
      ["PERFORMANCE", result.performance],
      ["COMPLETION TIME", result.formattedTime],
    ];

    let x = 72;
    boxes.forEach(([label, value], i) => {
      const width = i === 1 ? 205 : 150;
      doc.roundedRect(x, 395, width, 92, 12).lineWidth(1).stroke(light);
      doc.fillColor(gold).fontSize(10).font("Helvetica-Bold")
        .text(label, x, 417, { width, align: "center" });
      doc.fillColor(navy).fontSize(i === 1 ? 14 : 20).font("Helvetica-Bold")
        .text(value, x + 8, 445, { width: width - 16, align: "center" });
      x += width + 8;
    });

    doc.fillColor("#666").fontSize(11).font("Helvetica")
      .text(`Completion date: ${new Date(session.completed_at).toLocaleDateString("en-IN")}`, 0, 535, {
        align: "center",
      });

    doc.fillColor(navy).fontSize(12).font("Helvetica-Bold")
      .text(`Certificate ID: ${session.certificate_id}`, 0, 570, {
        align: "center",
      });

    doc.fillColor("#777").fontSize(9).font("Helvetica")
      .text(
        "This certificate represents performance in the IQNova educational challenge and is not a clinically validated IQ assessment.",
        75,
        690,
        { width: 445, align: "center" }
      );

    doc.fillColor(gold).fontSize(10).font("Helvetica-Bold")
      .text("IQNOVA", 0, 755, { align: "center" });

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