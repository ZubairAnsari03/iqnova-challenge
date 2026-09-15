import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./App_mobile_premium.css";

const API = "https://iqnova-challenge.onrender.com";

const questions = [
  {
    difficulty: "Easy",
    en: "What comes next? 🔵 ⭐ → 🔵 ⭐⭐ → 🔵 ⭐⭐⭐ → ?",
    hi: "अगला पैटर्न कौन सा होगा? 🔵 ⭐ → 🔵 ⭐⭐ → 🔵 ⭐⭐⭐ → ?",
    hinglish: "Agla pattern kaunsa hoga? 🔵 ⭐ → 🔵 ⭐⭐ → 🔵 ⭐⭐⭐ → ?",
    options: ["🔴 ⭐⭐⭐⭐", "🔵 ⭐⭐⭐⭐", "🔵 ⭐⭐", "⭐⭐⭐⭐"],
    answer: 1,
  },
  {
    difficulty: "Easy",
    en: "Which one is different from the others?",
    hi: "इनमें से बाकी से अलग कौन सा है?",
    hinglish: "Inmein se baaki sabse different kaunsa hai?",
    options: ["▲", "▲", "▲", "▼"],
    answer: 3,
  },
  {
    difficulty: "Easy",
    en: "CAT : KITTEN :: DOG : ?",
    hi: "CAT : KITTEN :: DOG : ?",
    hinglish: "CAT ka relation KITTEN se hai, waise DOG ka relation kis se hai?",
    options: ["Cub", "Puppy", "Calf", "Foal"],
    answer: 1,
  },

  {
    difficulty: "Hard",
    en: "You overtake the runner in 2nd position. What is your position?",
    hi: "आपने दूसरे स्थान वाले धावक को पीछे छोड़ दिया। अब आपकी स्थिति क्या है?",
    hinglish: "Tum 2nd position wale runner ko overtake karte ho. Ab tumhari position kya hai?",
    options: ["1st", "2nd", "3rd", "Last"],
    answer: 1,
  },
  {
    difficulty: "Hard",
    en: "A clock shows 3:15. What is the smaller angle between the hands?",
    hi: "घड़ी में 3:15 बज रहे हैं। दोनों सुइयों के बीच छोटा कोण कितना है?",
    hinglish: "Clock mein 3:15 baj rahe hain. Hands ke beech smaller angle kitna hai?",
    options: ["0°", "7.5°", "15°", "22.5°"],
    answer: 1,
  },
  {
    difficulty: "Hard",
    en: "What comes next? AZ → BY → CX → DW → ?",
    hi: "अगला जोड़ा कौन सा होगा? AZ → BY → CX → DW → ?",
    hinglish: "Agla pair kaunsa hoga? AZ → BY → CX → DW → ?",
    options: ["EU", "EV", "FU", "EX"],
    answer: 1,
  },
  {
    difficulty: "Hard",
    en: "A father is 4 times as old as his son. In 20 years, he will be twice his son's age. How old is the son now?",
    hi: "पिता की उम्र बेटे की उम्र की 4 गुना है। 20 साल बाद पिता बेटे की उम्र के 2 गुना होंगे। बेटे की वर्तमान उम्र क्या है?",
    hinglish: "Father ki age son ki age se 4 times hai. 20 years baad father son ki age se 2 times honge. Son ki current age kya hai?",
    options: ["8", "10", "12", "15"],
    answer: 1,
  },

  {
    difficulty: "Very Hard",
    en: "What comes next? 3, 8, 18, 38, 78, ?",
    hi: "अगला अंक कौन सा होगा? 3, 8, 18, 38, 78, ?",
    hinglish: "Agla number kaunsa hoga? 3, 8, 18, 38, 78, ?",
    options: ["148", "156", "158", "160"],
    answer: 2,
  },
  {
    difficulty: "Very Hard",
    en: "Three switches control three bulbs in another room. You can enter the bulb room only once. How can you identify all three switches?",
    hi: "तीन स्विच दूसरे कमरे के तीन बल्ब नियंत्रित करते हैं। आप बल्ब वाले कमरे में केवल एक बार जा सकते हैं। तीनों स्विच कैसे पहचानेंगे?",
    hinglish: "3 switches doosre room ke 3 bulbs control karte hain. Bulb room mein sirf ek baar ja sakte ho. Teeno switches kaise identify karoge?",
    options: [
      "Only look at the switches",
      "Turn one switch ON and enter immediately",
      "Turn one bulb ON, wait, turn it OFF, turn second ON, then enter",
      "It is impossible",
    ],
    answer: 2,
  },
  {
    difficulty: "Very Hard",
    en: "Three boxes are labelled APPLES, ORANGES and MIXED. Every label is wrong. Which box should you pick one fruit from to identify all three boxes?",
    hi: "तीन डिब्बों पर APPLES, ORANGES और MIXED लिखा है। हर लेबल गलत है। सभी डिब्बों की पहचान करने के लिए किस डिब्बे से एक फल निकालेंगे?",
    hinglish: "3 boxes par APPLES, ORANGES aur MIXED labels hain, lekin teeno labels wrong hain. Sab identify karne ke liye kis box se fruit nikaloge?",
    options: ["APPLES", "ORANGES", "MIXED", "Any box"],
    answer: 2,
  },

  {
    difficulty: "Extreme",
    en: "What comes next? ⬆️ → ➡️ → ⬇️ → ⬅️ → ?",
    hi: "अगला तीर किस दिशा में होगा? ⬆️ → ➡️ → ⬇️ → ⬅️ → ?",
    hinglish: "Agla arrow kis direction mein hoga? ⬆️ → ➡️ → ⬇️ → ⬅️ → ?",
    options: ["⬆️", "➡️", "⬇️", "↗️"],
    answer: 0,
  },
  {
    difficulty: "Extreme",
    en: "A farmer must cross a river with a wolf, a goat and a cabbage. He can carry only one at a time. What should he take first?",
    hi: "एक किसान को भेड़िया, बकरी और पत्तागोभी के साथ नदी पार करनी है। वह एक बार में केवल एक चीज ले जा सकता है। उसे सबसे पहले क्या ले जाना चाहिए?",
    hinglish: "Farmer ko wolf, goat aur cabbage ke saath river cross karni hai. Ek baar mein sirf ek cheez le ja sakta hai. Sabse pehle kya le jayega?",
    options: ["Wolf", "Goat", "Cabbage", "Wolf + Goat"],
    answer: 1,
  },
  {
    difficulty: "Extreme",
    en: "You have 9 identical-looking balls. One is heavier. What is the minimum number of balance-scale weighings needed to definitely find it?",
    hi: "आपके पास 9 एक जैसी दिखने वाली गेंदें हैं। उनमें से एक भारी है। उसे निश्चित रूप से खोजने के लिए कम से कम कितनी बार तराजू से तौलना होगा?",
    hinglish: "9 same-looking balls hain. Ek ball heavy hai. Use definitely find karne ke liye minimum kitni weighings chahiye?",
    options: ["1", "2", "3", "4"],
    answer: 1,
  },
];

const translations = {
  english: {
    how: "How It Works", why: "Why IQNova", verify: "Certificate Verify", start: "Start Challenge",
    badge: "13-Question Intelligence Challenge", title: "Challenge the way you think.",
    desc: "Test your logical reasoning, pattern recognition, numerical thinking and problem-solving skills with the IQNova Challenge.",
    learn: "Learn More", noLogin: "No login required", questions: "13 questions", unlock: "One-time ₹13 unlock",
    experience: "THE IQNOVA EXPERIENCE", built: "Built to challenge your thinking.",
    warmup: "From easy warm-ups to extreme reasoning puzzles.", levels: "4 Difficulty Levels",
    levelsDesc: "Easy, Hard, Very Hard and Extreme.", report: "Instant Report",
    reportDesc: "Unlock your score, analysis and certificate.", certificate: "CERTIFICATE",
    verifyTitle: "Verify an IQNova certificate.", verifyDesc: "Check a certificate using its unique Certificate ID.",
    verifyBtn: "Verify Certificate", before: "Before we begin.", details: "Enter your details to start the 13-question challenge.",
    name: "Full Name", age: "Age", email: "Email", begin: "Start the Test", back: "Back",
    question: "Question", next: "Next Question", finish: "Complete Challenge", complete: "CHALLENGE COMPLETE",
    resultReady: "Your result is ready.", fullUnlock: "One-time full result unlock", unlockResult: "Unlock Full Result",
    locked: "Locked", score: "Score", time: "Completion Time", performance: "Performance",
    cert: "Certificate", available: "Available", correct: "Correct Answers", analysis: "Performance Analysis",
    review: "Answer Review", resultUnlocked: "Result Unlocked!", download: "Download Certificate PDF",
    verifyHeading: "Certificate Verification", verifyInput: "Enter Certificate ID", verifyCheck: "Check Certificate",
    verified: "Certificate Verified", notFound: "Certificate not found.", backHome: "Back to Home",
    footer: "IQNova is an educational intelligence challenge and is not a clinically validated IQ assessment."
  },
  hindi: {
    how: "यह कैसे काम करता है", why: "IQNova क्यों", verify: "सर्टिफिकेट सत्यापित करें", start: "चैलेंज शुरू करें",
    badge: "13 प्रश्नों की बुद्धिमत्ता चुनौती", title: "अपनी सोच को चुनौती दें।",
    desc: "IQNova Challenge के साथ अपनी तार्किक सोच, पैटर्न पहचान, संख्यात्मक सोच और समस्या-समाधान कौशल को परखें।",
    learn: "और जानें", noLogin: "लॉगिन की जरूरत नहीं", questions: "13 प्रश्न", unlock: "एक बार ₹13 में अनलॉक",
    experience: "IQNOVA का अनुभव", built: "आपकी सोच को चुनौती देने के लिए बनाया गया।",
    warmup: "आसान शुरुआत से लेकर कठिन तर्क पहेलियों तक।", levels: "4 कठिनाई स्तर",
    levelsDesc: "आसान, कठिन, बहुत कठिन और अत्यंत कठिन।", report: "तुरंत रिपोर्ट",
    reportDesc: "अपना स्कोर, विश्लेषण और सर्टिफिकेट अनलॉक करें।", certificate: "सर्टिफिकेट",
    verifyTitle: "IQNova सर्टिफिकेट सत्यापित करें।", verifyDesc: "अपने यूनिक Certificate ID से सर्टिफिकेट चेक करें.",
    verifyBtn: "सर्टिफिकेट सत्यापित करें", before: "शुरू करने से पहले।", details: "13 प्रश्नों की चुनौती शुरू करने के लिए अपनी जानकारी भरें।",
    name: "पूरा नाम", age: "उम्र", email: "ईमेल", begin: "टेस्ट शुरू करें", back: "वापस",
    question: "प्रश्न", next: "अगला प्रश्न", finish: "चैलेंज पूरा करें", complete: "चैलेंज पूरा हुआ",
    resultReady: "आपका परिणाम तैयार है।", fullUnlock: "एक बार में पूरा परिणाम अनलॉक", unlockResult: "पूरा परिणाम अनलॉक करें",
    locked: "लॉक", score: "स्कोर", time: "पूरा करने का समय", performance: "प्रदर्शन",
    cert: "सर्टिफिकेट", available: "उपलब्ध", correct: "सही उत्तर", analysis: "प्रदर्शन विश्लेषण",
    review: "उत्तर समीक्षा", resultUnlocked: "परिणाम अनलॉक!", download: "सर्टिफिकेट PDF डाउनलोड करें",
    verifyHeading: "सर्टिफिकेट सत्यापन", verifyInput: "Certificate ID डालें", verifyCheck: "सर्टिफिकेट चेक करें",
    verified: "सर्टिफिकेट सत्यापित है", notFound: "सर्टिफिकेट नहीं मिला।", backHome: "होम पर वापस जाएं",
    footer: "IQNova एक शैक्षिक बुद्धिमत्ता चुनौती है और यह clinically validated IQ assessment नहीं है।"
  },
  hinglish: {
    how: "Kaise Kaam Karta Hai", why: "IQNova Kyun", verify: "Certificate Verify", start: "Challenge Start Karo",
    badge: "13-Question Intelligence Challenge", title: "Apni thinking ko challenge karo.",
    desc: "IQNova Challenge ke saath apni logical reasoning, pattern recognition, numerical thinking aur problem-solving skills test karo.",
    learn: "Aur Jaano", noLogin: "Login ki zarurat nahi", questions: "13 questions", unlock: "One-time ₹13 unlock",
    experience: "THE IQNOVA EXPERIENCE", built: "Tumhari thinking ko challenge karne ke liye banaya gaya.",
    warmup: "Easy warm-up se lekar extreme reasoning puzzles tak.", levels: "4 Difficulty Levels",
    levelsDesc: "Easy, Hard, Very Hard aur Extreme.", report: "Instant Report",
    reportDesc: "Apna score, analysis aur certificate unlock karo.", certificate: "CERTIFICATE",
    verifyTitle: "IQNova certificate verify karo.", verifyDesc: "Unique Certificate ID se certificate check karo.",
    verifyBtn: "Certificate Verify Karo", before: "Shuru karne se pehle.", details: "13-question challenge start karne ke liye apni details bharo.",
    name: "Full Name", age: "Age", email: "Email", begin: "Test Shuru Karo", back: "Back",
    question: "Question", next: "Next Question", finish: "Challenge Complete Karo", complete: "CHALLENGE COMPLETE",
    resultReady: "Tumhara result ready hai.", fullUnlock: "One-time full result unlock", unlockResult: "Full Result Unlock Karo",
    locked: "Locked", score: "Score", time: "Completion Time", performance: "Performance",
    cert: "Certificate", available: "Available", correct: "Correct Answers", analysis: "Performance Analysis",
    review: "Answer Review", resultUnlocked: "Result Unlocked!", download: "Download Certificate PDF",
    verifyHeading: "Certificate Verification", verifyInput: "Certificate ID daalo", verifyCheck: "Certificate Check Karo",
    verified: "Certificate Verified", notFound: "Certificate nahi mila.", backHome: "Home par wapas",
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
  { key: "Hard", label: "Hard", max: 28 },
  { key: "Very Hard", label: "Very Hard", max: 27 },
  { key: "Extreme", label: "Extreme", max: 33 }
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
  const currentQuestion = questions[current];

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
          email: student.email
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
    if (current < questions.length - 1) {
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
                <div><strong>{questions.length}</strong><span>{t.questions}</span></div>
                <div><strong>100</strong><span>Max Score</span></div>
              </div>
              <div className="difficulty">
                <span>Easy</span><span>Hard</span><span>Very Hard</span><span>Extreme</span>
              </div>
              <div className="card-footer"><span>IQNOVA</span><span>01 — {questions.length}</span></div>
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
              <button className="secondary-button" onClick={() => setPage("home")}>← {t.back}</button>
              <button className="primary-button" onClick={startChallenge}>{t.begin}<span>→</span></button>
            </div>
          </div>
        </main>
      )}

      {page === "quiz" && (
        <main className="quiz-page">
          <div className="quiz-top">
            <span>{t.question} {current + 1} / {questions.length}</span>
            <span className={`difficulty-label ${currentQuestion.difficulty.toLowerCase().replace(" ", "-")}`}>{currentQuestion.difficulty}</span>
          </div>

          <div className="progress">
            <div style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>

          <div className="question-card">
            <div className="question-header">
              <div className="question-number">{String(current + 1).padStart(2, "0")}</div>
              <span>{currentQuestion.difficulty}</span>
            </div>

            <h1>
  {language === "english"
    ? currentQuestion.en
    : language === "hindi"
      ? currentQuestion.hi
      : currentQuestion.hinglish}
</h1>

            <div className="options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={answers[current] === index ? "option selected" : "option"}
                  onClick={() => setAnswers((prev) => ({ ...prev, [current]: index }))}
                >
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                </button>
              ))}
            </div>

            <button className="primary-button next-button" disabled={answers[current] === undefined} onClick={nextQuestion}>
              {current === questions.length - 1 ? t.finish : t.next}<span>→</span>
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
