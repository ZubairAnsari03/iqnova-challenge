import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./App_mobile_premium.css";

const API = "https://iqnova-challenge.onrender.com";

const INTERESTS = [
  "📚 Education & Study",
  "📱 Social Media",
  "🏏 Cricket & Sports",
  "🎬 Movies & Entertainment",
  "🌍 World & Politics",
  "❤️ Relationship & Social Situations",
  "🧠 Quiz & General Knowledge",
  "🧩 Puzzle & Mathematics",
];

const QUESTION_COUNT = 15;

const translations = {
  english: {
    how: "How It Works", why: "Why IQNova", verify: "Certificate Verify", start: "Start Challenge",
    badge: "15-Question Intelligence Challenge", title: "Challenge the way you think.",
    desc: "Test your logical reasoning, pattern recognition, numerical thinking and problem-solving skills with the IQNova Challenge.",
    learn: "Learn More", noLogin: "No login required", questions: "15 questions", unlock: "One-time ₹19 unlock",
    experience: "THE IQNOVA EXPERIENCE", built: "Built to challenge your thinking.",
    warmup: "From easy warm-ups to extreme reasoning puzzles.", levels: "4 Difficulty Levels",
    levelsDesc: "Easy, Hard, Very Hard and Extreme.", report: "Instant Report",
    reportDesc: "Unlock your score, analysis and certificate.", certificate: "CERTIFICATE",
    verifyTitle: "Verify an IQNova certificate.", verifyDesc: "Check a certificate using its unique Certificate ID.",
    verifyBtn: "Verify Certificate", before: "Before we begin.", details: "Enter your details to start the 15-question challenge.",
    name: "Full Name", age: "Age", email: "Email", begin: "Start the Test", back: "Back",
    question: "Question", next: "Next Question", finish: "Complete Challenge", complete: "CHALLENGE COMPLETE",
    resultReady: "Your result is ready.", fullUnlock: "One-time full result unlock", unlockResult: "Unlock Full Result",
    locked: "Locked", score: "Score", time: "Completion Time", performance: "Performance",
    cert: "Certificate", available: "Available", correct: "Correct Answers", analysis: "Performance Analysis",
    review: "Answer Review", resultUnlocked: "Result Unlocked!", download: "Download Certificate PDF",
    verifyHeading: "Certificate Verification", verifyInput: "Enter Certificate ID", verifyCheck: "Check Certificate",
    verified: "Certificate Verified", notFound: "Certificate not found.", backHome: "Back to Home",
    interestTitle: "🧠 Choose Your Interests", interestDesc: "Select exactly 5 topics for your personalized challenge.", selected: "selected",
     footer: "IQNova is an educational intelligence challenge and is not a clinically validated IQ assessment."
  },
  hindi: {
    how: "यह कैसे काम करता है", why: "IQNova क्यों", verify: "सर्टिफिकेट सत्यापित करें", start: "चैलेंज शुरू करें",
    badge: "15 प्रश्नों की बुद्धिमत्ता चुनौती", title: "अपनी सोच को चुनौती दें।",
    desc: "IQNova Challenge के साथ अपनी तार्किक सोच, पैटर्न पहचान, संख्यात्मक सोच और समस्या-समाधान कौशल को परखें।",
    learn: "और जानें", noLogin: "लॉगिन की जरूरत नहीं", questions: "15 प्रश्न", unlock: "एक बार ₹19 में अनलॉक",
    experience: "IQNOVA का अनुभव", built: "आपकी सोच को चुनौती देने के लिए बनाया गया।",
    warmup: "आसान शुरुआत से लेकर कठिन तर्क पहेलियों तक।", levels: "4 कठिनाई स्तर",
    levelsDesc: "आसान, कठिन, बहुत कठिन और अत्यंत कठिन।", report: "तुरंत रिपोर्ट",
    reportDesc: "अपना स्कोर, विश्लेषण और सर्टिफिकेट अनलॉक करें।", certificate: "सर्टिफिकेट",
    verifyTitle: "IQNova सर्टिफिकेट सत्यापित करें।", verifyDesc: "अपने यूनिक Certificate ID से सर्टिफिकेट चेक करें.",
    verifyBtn: "सर्टिफिकेट सत्यापित करें", before: "शुरू करने से पहले।", details: "15 प्रश्नों की चुनौती शुरू करने के लिए अपनी जानकारी भरें।",
    name: "पूरा नाम", age: "उम्र", email: "ईमेल", begin: "टेस्ट शुरू करें", back: "वापस",
    question: "प्रश्न", next: "अगला प्रश्न", finish: "चैलेंज पूरा करें", complete: "चैलेंज पूरा हुआ",
    resultReady: "आपका परिणाम तैयार है।", fullUnlock: "एक बार में पूरा परिणाम अनलॉक", unlockResult: "पूरा परिणाम अनलॉक करें",
    locked: "लॉक", score: "स्कोर", time: "पूरा करने का समय", performance: "प्रदर्शन",
    cert: "सर्टिफिकेट", available: "उपलब्ध", correct: "सही उत्तर", analysis: "प्रदर्शन विश्लेषण",
    review: "उत्तर समीक्षा", resultUnlocked: "परिणाम अनलॉक!", download: "सर्टिफिकेट PDF डाउनलोड करें",
    verifyHeading: "सर्टिफिकेट सत्यापन", verifyInput: "Certificate ID डालें", verifyCheck: "सर्टिफिकेट चेक करें",
    verified: "सर्टिफिकेट सत्यापित है", notFound: "सर्टिफिकेट नहीं मिला।", backHome: "होम पर वापस जाएं",
    interestTitle: "🧠 अपनी रुचियां चुनें", interestDesc: "अपने personalized challenge के लिए ठीक 5 topics चुनें।", selected: "चयनित",
     footer: "IQNova एक शैक्षिक बुद्धिमत्ता चुनौती है और यह clinically validated IQ assessment नहीं है।"
  },
  hinglish: {
    how: "Kaise Kaam Karta Hai", why: "IQNova Kyun", verify: "Certificate Verify", start: "Challenge Start Karo",
    badge: "15-Question Intelligence Challenge", title: "Apni thinking ko challenge karo.",
    desc: "IQNova Challenge ke saath apni logical reasoning, pattern recognition, numerical thinking aur problem-solving skills test karo.",
    learn: "Aur Jaano", noLogin: "Login ki zarurat nahi", questions: "15 questions", unlock: "One-time ₹19 unlock",
    experience: "THE IQNOVA EXPERIENCE", built: "Tumhari thinking ko challenge karne ke liye banaya gaya.",
    warmup: "Easy warm-up se lekar extreme reasoning puzzles tak.", levels: "4 Difficulty Levels",
    levelsDesc: "Easy, Hard, Very Hard aur Extreme.", report: "Instant Report",
    reportDesc: "Apna score, analysis aur certificate unlock karo.", certificate: "CERTIFICATE",
    verifyTitle: "IQNova certificate verify karo.", verifyDesc: "Unique Certificate ID se certificate check karo.",
    verifyBtn: "Certificate Verify Karo", before: "Shuru karne se pehle.", details: "15-question challenge start karne ke liye apni details bharo.",
    name: "Full Name", age: "Age", email: "Email", begin: "Test Shuru Karo", back: "Back",
    question: "Question", next: "Next Question", finish: "Challenge Complete Karo", complete: "CHALLENGE COMPLETE",
    resultReady: "Tumhara result ready hai.", fullUnlock: "One-time full result unlock", unlockResult: "Full Result Unlock Karo",
    locked: "Locked", score: "Score", time: "Completion Time", performance: "Performance",
    cert: "Certificate", available: "Available", correct: "Correct Answers", analysis: "Performance Analysis",
    review: "Answer Review", resultUnlocked: "Result Unlocked!", download: "Download Certificate PDF",
    verifyHeading: "Certificate Verification", verifyInput: "Certificate ID daalo", verifyCheck: "Certificate Check Karo",
    verified: "Certificate Verified", notFound: "Certificate nahi mila.", backHome: "Home par wapas",
    interestTitle: "🧠 Apni Interests Chuno", interestDesc: "Apne personalized challenge ke liye exactly 5 topics select karo.", selected: "selected",
     footer: "IQNova ek educational intelligence challenge hai, clinically validated IQ assessment nahi hai."
  }
};

function performanceText(score, language) {
  const sets = {
    english: [
      [20, "Very Slow / Beginner"], [40, "Developing"], [60, "Average"], [80, "High"], [100, "Exceptional"]
    ],
    hindi: [
      [20, "बहुत धीमा / शुरुआती"], [40, "विकासशील"], [60, "औसत"], [80, "उच्च"], [100, "असाधारण"]
    ],
    hinglish: [
      [20, "Very Slow / Beginner"], [40, "Developing"], [60, "Average"], [80, "High"], [100, "Exceptional"]
    ]
  };
  return sets[language].find(([max]) => score <= max)?.[1] || "";
}

function analysisForResult(result, language) {
  const groups = [
  { key: "Easy", label: "Easy", max: 12 },
  { key: "Hard", label: "Hard", max: 20 },
  { key: "Very Hard", label: "Very Hard", max: 32 },
  { key: "Extreme", label: "Extreme", max: 36 }
];

  return groups.map((group) => {
    const items = result.review.filter((item) => item.difficulty === group.key);
    const earned = items.reduce((sum, item) => sum + item.points, 0);
    return {
      ...group,
      earned,
      percentage: Math.round((earned / group.max) * 100)
    };
  });
}

function App() {
  const [page, setPage] = useState("home");
  const [language, setLanguage] = useState("hinglish");
  const [current, setCurrent] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [student, setStudent] = useState({ name: "", age: "", email: "" });
  const [sessionId, setSessionId] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentPaid, setPaymentPaid] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [certificateId, setCertificateId] = useState("");
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const t = translations[language];
  const currentQuestion = quizQuestions[current];

  // Backend-safe question text. Supports both object and string formats.
  const questionText = (() => {
    const raw = currentQuestion?.question;

    if (typeof raw === "string") return raw;

    if (raw && typeof raw === "object") {
      return raw[language] || raw.hinglish || raw.en || raw.hi || "";
    }

    return "";
  })();

  // Backend-safe options. ALWAYS returns an array, so .map() cannot crash.
  const questionOptions = (() => {
    const raw = currentQuestion?.options;

    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const localized = raw[language];
      if (Array.isArray(localized)) return localized;

      if (Array.isArray(raw.hinglish)) return raw.hinglish;
      if (Array.isArray(raw.en)) return raw.en;
      if (Array.isArray(raw.hi)) return raw.hi;
    }

    return [];
  })();

  const loadPaidResult = async (sid) => {
    const response = await fetch(`${API}/api/challenge/result/${sid}`);
    const data = await response.json();

    if (response.ok && data.success && data.paid) {
      setServerResult(data.result);
      setPaymentPaid(true);
      setCertificateId(data.result.certificateId || "");
      setPage("result");
      localStorage.setItem("iqnova_payment_paid", "true");
      localStorage.setItem("iqnova_result", JSON.stringify(data.result));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }

    return false;
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("iqnova_session_id");
    const savedStudent = localStorage.getItem("iqnova_student");
    const savedResult = localStorage.getItem("iqnova_result");
    const savedPaid = localStorage.getItem("iqnova_payment_paid");

    if (savedSession) setSessionId(savedSession);
    if (savedStudent) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch {}
    }
    if (savedResult) {
      try {
        setServerResult(JSON.parse(savedResult));
      } catch {}
    }
    if (savedPaid === "true") setPaymentPaid(true);

const params = new URLSearchParams(window.location.search);

const callbackSession =
  params.get("sessionId") ||
  params.get("reference_id") ||
  params.get("razorpay_payment_link_reference_id") ||
  localStorage.getItem("iqnova_session_id");

const payment =
  params.get("payment") ||
  (params.get("razorpay_payment_id") ? "success" : "");

if (callbackSession) {
  setSessionId(callbackSession);
  localStorage.setItem("iqnova_session_id", callbackSession);
  setPage("result");

  if (payment === "success") {
    const timer = setInterval(async () => {
      try {
        const done = await loadPaidResult(callbackSession);
        if (done) clearInterval(timer);
      } catch {}
    }, 2500);

    loadPaidResult(callbackSession).then((done) => {
      if (done) clearInterval(timer);
    });

    setTimeout(() => clearInterval(timer), 10 * 60 * 1000);
  }

  window.history.replaceState({}, "", window.location.pathname);
}
  }, []);

  const startChallenge = async () => {
    if (selectedInterests.length !== 5) {
  alert(
    language === "hindi"
      ? "कृपया ठीक 5 रुचियां चुनें।"
      : language === "english"
        ? "Please select exactly 5 interests."
        : "Bhai exactly 5 interests select karo."
  );
  return;
}
    if (!student.name || !student.age || !student.email) {
      alert(
        language === "hindi"
          ? "Kripya apna naam, age aur email bhariye."
          : language === "english"
            ? "Please enter your name, age and email."
            : "Bhai naam, age aur email bhar do."
      );
      return;
    }

    try {
      const newSessionId = `IQNOVA-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const response = await fetch(`${API}/api/challenge/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: newSessionId,
          name: student.name,
          age: student.age,
          email: student.email,
          interests: selectedInterests
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Challenge start failed");
      }

      setSessionId(newSessionId);
setPaymentPaid(false);
setServerResult(null);
setCertificateId("");
setCurrent(0);
setAnswers({});

if (!Array.isArray(data.questions) || data.questions.length !== QUESTION_COUNT) {
  throw new Error("15 questions generate nahi hue.");
}

setQuizQuestions(data.questions);

setPage("quiz");

      localStorage.setItem("iqnova_session_id", newSessionId);
      localStorage.setItem("iqnova_student", JSON.stringify(student));
      localStorage.removeItem("iqnova_payment_paid");
      localStorage.removeItem("iqnova_result");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert(
        language === "hindi"
          ? "Challenge start karne mein problem hui."
          : language === "english"
            ? "There was a problem starting the challenge."
            : "Challenge start karne mein problem ho gayi."
      );
    }
  };

  const nextQuestion = async () => {
    if (current < quizQuestions.length - 1) {
      setCurrent((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const response = await fetch(`${API}/api/challenge/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Result calculation failed");
      }

      setPaymentPaid(Boolean(data.paid));
      setPage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (data.paid) {
        await loadPaidResult(sessionId);
      }
    } catch (error) {
      console.error(error);
      alert(
        language === "hindi"
          ? "Result calculate karne mein problem hui."
          : language === "english"
            ? "There was a problem calculating your result."
            : "Result calculate karne mein problem ho gayi."
      );
    }
  };

  const unlockResult = async () => {
    try {
      setPaymentLoading(true);

      if (!sessionId) throw new Error("Session ID missing");

      localStorage.setItem("iqnova_session_id", sessionId);
      localStorage.setItem("iqnova_student", JSON.stringify(student));

      const response = await fetch(`${API}/api/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: student.name,
          email: student.email
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment link create failed");
      }

      if (data.paid) {
        await loadPaidResult(sessionId);
        return;
      }

      window.location.href = data.shortUrl;

      const check = async () => {
        try {
          const response = await fetch(`${API}/api/payment/status/${sessionId}`);
          const status = await response.json();

          if (status.success && status.paid) {
            await loadPaidResult(sessionId);
            return true;
          }
        } catch (error) {
          console.error(error);
        }
        return false;
      };

      let done = await check();

      const timer = setInterval(async () => {
        if (done) {
          clearInterval(timer);
          return;
        }
        done = await check();
        if (done) clearInterval(timer);
      }, 2500);

      setTimeout(() => clearInterval(timer), 10 * 60 * 1000);
    } catch (error) {
      console.error(error);
      alert(
        language === "hindi"
          ? "Payment link banane mein problem hui."
          : language === "english"
            ? "There was a problem creating the payment link."
            : "Payment link banane mein problem ho gayi."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificateId) return;

    try {
      const response = await fetch(`${API}/api/certificate/${certificateId}/pdf`);

      if (!response.ok) throw new Error("Certificate download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `IQNova-Certificate-${certificateId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Certificate PDF download failed.");
    }
  };

  const verifyCertificate = async () => {
    if (!verifyId.trim()) return;

    try {
      setVerifyLoading(true);
      setVerifyResult(null);

      const response = await fetch(
        `${API}/api/certificate/${encodeURIComponent(verifyId.trim())}`
      );

      const data = await response.json();
      setVerifyResult(data);
    } catch (error) {
      console.error(error);
      setVerifyResult({ success: false, verified: false, message: t.notFound });
    } finally {
      setVerifyLoading(false);
    }
  };

  const analysis = useMemo(
    () => (serverResult ? analysisForResult(serverResult, language) : []),
    [serverResult, language]
  );

  return (
    <div className="app">
      <nav className="navbar">
        <button className="logo" onClick={() => setPage("home")}>
          <div className="logo-mark">IQ</div>
          <span>IQNova</span>
        </button>

        <div className="nav-links">
          <a href="#how">{t.how}</a>
          <a href="#why">{t.why}</a>
          <button className="nav-text-button" onClick={() => setPage("verify")}>
            {t.verify}
          </button>
        </div>

        <div className="nav-right">
          <div className="language-switcher">
            <button className={language === "english" ? "active" : ""} onClick={() => setLanguage("english")}>English</button>
            <button className={language === "hindi" ? "active" : ""} onClick={() => setLanguage("hindi")}>हिंदी</button>
            <button className={language === "hinglish" ? "active" : ""} onClick={() => setLanguage("hinglish")}>Hinglish</button>
          </div>

          <button className="nav-cta" onClick={() => setPage("start")}>{t.start}</button>
        </div>
      </nav>

      {page === "home" && (
        <>
          <main className="hero">
            <div className="hero-content">
              <div className="badge"><span>✦</span>{t.badge}</div>
              <h1>
                {language === "english" && <>Challenge the way<br /><span>you think.</span></>}
                {language === "hindi" && <>अपनी सोच को<br /><span>चुनौती दें।</span></>}
                {language === "hinglish" && <>Apni thinking ko<br /><span>challenge karo.</span></>}
              </h1>
              <p>{t.desc}</p>

              <div className="hero-buttons">
                <button className="primary-button" onClick={() => setPage("start")}>{t.start}<span>→</span></button>
                <a className="secondary-button" href="#how">{t.learn}</a>
              </div>

              <div className="trust-line">
                <div><span>✓</span>{t.noLogin}</div>
                <div><span>✓</span>{t.questions}</div>
                <div><span>✓</span>{t.unlock}</div>
              </div>
            </div>

            <div className="hero-card">
              <div className="card-shine" />
              <div className="brain-icon">IQ</div>
              <div className="mini-label">IQNOVA</div>
              <h2>IQ Challenge</h2>
              <div className="score-preview">
                <div><strong>{QUESTION_COUNT}</strong><span>{t.questions}</span></div>
                <div><strong>100</strong><span>Max Score</span></div>
              </div>
              <div className="difficulty">
                <span>Easy</span><span>Hard</span><span>Very Hard</span><span>Extreme</span>
              </div>
              <div className="card-footer"><span>IQNOVA</span><span>01 — {QUESTION_COUNT}</span></div>
            </div>
          </main>

          <section className="features" id="how">
            <div className="section-heading">
              <p>{t.experience}</p>
              <h2>{t.built}</h2>
            </div>
            <div className="feature-grid">
              <div className="feature-card"><div className="feature-number">01</div><div className="feature-icon">◈</div><h3>{t.questions}</h3><p>{t.warmup}</p></div>
              <div className="feature-card"><div className="feature-number">02</div><div className="feature-icon">◇</div><h3>{t.levels}</h3><p>{t.levelsDesc}</p></div>
              <div className="feature-card"><div className="feature-number">03</div><div className="feature-icon">✦</div><h3>{t.report}</h3><p>{t.reportDesc}</p></div>
            </div>
          </section>

          <section className="verify-section" id="verify">
            <div><div className="mini-label">{t.certificate}</div><h2>{t.verifyTitle}</h2><p>{t.verifyDesc}</p></div>
            <button className="secondary-button" onClick={() => setPage("verify")}>{t.verifyBtn} →</button>
          </section>

          <footer id="why">
            <div className="logo"><div className="logo-mark">IQ</div><span>IQNova</span></div>
            <p>{t.footer}</p>
          </footer>
        </>
      )}

      {page === "start" && (
        <main className="start-page">
          <div className="start-box">
            <div className="badge">IQNOVA — IQ CHALLENGE</div>
            <h1>{t.before}</h1>
            <p>{t.details}</p>
            
            <div className="interest-section">
  <h2>{t.interestTitle}</h2>
  <p>{t.interestDesc}</p>

  <div className="interest-grid">
    {INTERESTS.map((interest) => {
      const selected = selectedInterests.includes(interest);

      return (
        <button
          type="button"
          key={interest}
          className={`interest-card ${selected ? "selected" : ""}`}
          onClick={() => {
            setSelectedInterests((prev) => {
              if (prev.includes(interest)) {
                return prev.filter((item) => item !== interest);
              }

              if (prev.length >= 5) {
                return prev;
              }

              return [...prev, interest];
            });
          }}
        >
          <span>{selected ? "✓" : "○"}</span>
          {interest}
        </button>
      );
    })}
  </div>

  <div className="interest-count">
    {selectedInterests.length} / 5 {t.selected}
  </div>
</div>

            <div className="form-grid">
              <label>{t.name}
                <input type="text" value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} placeholder={t.name} />
              </label>
              <label>{t.age}
                <input type="number" min="10" max="100" value={student.age} onChange={(e) => setStudent({ ...student, age: e.target.value })} placeholder={t.age} />
              </label>
              <label className="full-width">{t.email}
                <input type="email" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} placeholder={t.email} />
              </label>
            </div>

            <div className="start-actions">
              <button className="secondary-button" onClick={() => { setSelectedInterests([]); setPage("home"); }}>← {t.back}</button>
              <button className="primary-button" onClick={startChallenge}>{t.begin}<span>→</span></button>
            </div>
          </div>
        </main>
      )}

      {page === "quiz" && currentQuestion && (
  <main className="quiz-page">
    <div className="quiz-top">
      <span>
        {t.question} {current + 1} / {quizQuestions.length}
      </span>

      <span
        className={`difficulty-label ${currentQuestion.difficulty
          .toLowerCase()
          .replace(" ", "-")}`}
      >
        {currentQuestion.difficulty}
      </span>
    </div>

    <div className="progress">
      <div
        style={{
          width: `${((current + 1) / quizQuestions.length) * 100}%`,
        }}
      />
    </div>

    <div className="question-card">
      <div className="question-header">
        <div className="question-number">
          {String(current + 1).padStart(2, "0")}
        </div>
        <span>{currentQuestion.difficulty}</span>
      </div>

      <h1>{questionText}</h1>

      <div className="options">
  {questionOptions.map((option, index) => (
    <button
      key={index}
      type="button"
      className={`option ${answers[current] === index ? "selected" : ""}`}
      onClick={() =>
        setAnswers((prev) => ({
          ...prev,
          [current]: index,
        }))
      }
    >
      <span>{String.fromCharCode(65 + index)}</span>
      <span>{option}</span>
    </button>
  ))}
</div>

      <button
        className="primary-button next-button"
        disabled={answers[current] === undefined}
        onClick={nextQuestion}
      >
        {current === quizQuestions.length - 1
          ? t.finish
          : t.next}
        <span>→</span>
      </button>
    </div>
  </main>
)}
      
      {page === "result" && (
        <main className="start-page">
          <div className="start-box result-box">
            <div className="badge">{t.complete}</div>
            <h1>{t.resultReady}</h1>

            <p>
              {paymentPaid
                ? "Payment verified — tumhara complete result unlock ho gaya hai."
                : "Tumhara result generate ho chuka hai. ₹19 pay karke complete result aur certificate unlock karo."}
            </p>

            <div className="result-preview-grid">
              <div className="result-preview-card"><span>🏆</span><small>{t.score}</small><strong>{paymentPaid && serverResult ? `${serverResult.score} / 100` : "🔒 Locked"}</strong></div>
              <div className="result-preview-card"><span>⏱</span><small>{t.time}</small><strong>{paymentPaid && serverResult ? serverResult.formattedTime : "🔒 Locked"}</strong></div>
              <div className="result-preview-card"><span>📊</span><small>{t.performance}</small><strong>{paymentPaid && serverResult ? serverResult.performance : "🔒 Locked"}</strong></div>
              <div className="result-preview-card"><span>🎓</span><small>{t.cert}</small><strong>{paymentPaid ? t.available : "🔒 Locked"}</strong></div>
            </div>

            {!paymentPaid && (
              <>
                <div className="unlock-offer"><strong>₹19</strong><span>{t.fullUnlock}</span></div>
                <button className="primary-button" onClick={unlockResult} disabled={paymentLoading}>
                  {paymentLoading ? "Payment check ho raha hai..." : t.unlockResult}<span>→</span>
                </button>
                <p className="email-note">Payment option available hote hi tumhare entered email par unlock instructions bhi bhej diye jaate hain.</p>
              </>
            )}

            {paymentPaid && serverResult && (
              <div className="unlocked-result">
                <h2>🎉 {t.resultUnlocked}</h2>

                <div className="full-result-summary">
                  <div><span>{t.score}</span><strong>{serverResult.score} / 100</strong></div>
                  <div><span>{t.correct}</span><strong>{serverResult.correctCount} / {serverResult.totalQuestions}</strong></div>
                  <div><span>{t.time}</span><strong>{serverResult.formattedTime}</strong></div>
                  <div><span>{t.performance}</span><strong>{serverResult.performance}</strong></div>
                </div>

                <div className="report-section">
                  <h3>🧠 {t.analysis}</h3>
                  <div className="analysis-grid">
                    {analysis.map((item) => (
                      <div className="analysis-card" key={item.key}>
                        <span>{item.label}</span>
                        <strong>{item.earned} / {item.max}</strong>
                        <small>{item.percentage}%</small>
                      </div>
                    ))}
                  </div>
                  <div className="feedback-card">
                    <strong>{performanceText(serverResult.score, language)}</strong>
                    <p>
                      {serverResult.score >= 81
                        ? "Excellent reasoning performance. Tumne difficult aur extreme problems mein strong consistency dikhayi."
                        : serverResult.score >= 61
                          ? "Strong performance. Pattern recognition aur logical reasoning mein achha balance raha."
                          : serverResult.score >= 41
                            ? "Overall performance average range mein hai. Hard aur Very Hard questions ki practice se improvement ho sakta hai."
                            : "Foundation build karne par focus karo. Easy patterns ko strong karke gradually harder reasoning puzzles solve karo."}
                    </p>
                  </div>
                </div>

                <div className="report-section">
                  <h3>📋 {t.review}</h3>
                  {serverResult.review.map((item) => (
                    <div key={item.question} className={`answer-review-item ${item.correct ? "correct" : "wrong"}`}>
                      <span>Q{item.question} · {item.difficulty}</span>
                      <span>{item.correct ? `✓ Correct (+${item.points})` : `✗ Wrong (0/${item.maxPoints})`}</span>
                    </div>
                  ))}
                </div>

                <div className="certificate-actions">
                  <button className="primary-button" onClick={downloadCertificate}>{t.download}<span>↓</span></button>
                  {certificateId && (
                    <button className="secondary-button" onClick={() => { setVerifyId(certificateId); setPage("verify"); }}>
                      {t.verifyBtn}
                    </button>
                  )}
                </div>

                <p className="certificate-note">
                  Certificate ID: <strong>{certificateId}</strong><br />
                  Certificate PDF tumhare entered email par bhi bheja jaata hai after verified payment.
                </p>
              </div>
            )}

            {paymentPaid && !serverResult && (
              <div className="unlocked-result"><p>Result load ho raha hai...</p></div>
            )}
          </div>
        </main>
      )}

      {page === "verify" && (
        <main className="start-page">
          <div className="start-box">
            <div className="badge">{t.certificate}</div>
            <h1>{t.verifyHeading}</h1>
            <p>{t.verifyDesc}</p>

            <div className="verification-form">
              <input
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value.toUpperCase())}
                placeholder={t.verifyInput}
              />
              <button className="primary-button" onClick={verifyCertificate} disabled={verifyLoading}>
                {verifyLoading ? "Checking..." : t.verifyCheck}<span>→</span>
              </button>
            </div>

            {verifyResult?.verified && (
              <div className="verification-result verified-result">
                <h2>✓ {t.verified}</h2>
                <p><strong>Certificate ID:</strong> {verifyResult.certificate.certificateId}</p>
                <p><strong>Name:</strong> {verifyResult.certificate.name}</p>
                <p><strong>Score:</strong> {verifyResult.certificate.score} / 100</p>
                <p><strong>Performance:</strong> {verifyResult.certificate.performance}</p>
                <p><strong>Completion Time:</strong> {verifyResult.certificate.completionTime}</p>
                <button className="secondary-button" onClick={async () => {
                  setCertificateId(verifyResult.certificate.certificateId);
                  const response = await fetch(`${API}/api/certificate/${verifyResult.certificate.certificateId}/pdf`);
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `IQNova-Certificate-${verifyResult.certificate.certificateId}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}>{t.download}</button>
              </div>
            )}

            {verifyResult && !verifyResult.verified && (
              <div className="verification-result wrong-result">
                <h2>✕ {t.notFound}</h2>
              </div>
            )}

            <button className="secondary-button" onClick={() => setPage("home")}>← {t.backHome}</button>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
