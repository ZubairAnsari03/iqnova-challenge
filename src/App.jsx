import { useState } from "react";
import "./App.css";

const questions = [
  {
    q: {
      english: "A number is doubled, then 6 is added. The result is 20. What is the number?",
      hindi: "एक संख्या को दोगुना करके उसमें 6 जोड़ा जाता है। परिणाम 20 आता है। संख्या क्या है?",
      hinglish: "Ek number ko double karke usme 6 add kiya jata hai. Result 20 hai. Number kya hai?"
    },
    options: {
      english: ["6", "7", "8", "9"],
      hindi: ["6", "7", "8", "9"],
      hinglish: ["6", "7", "8", "9"]
    },
    answer: 2,
    difficulty: "Easy"
  },
  {
    q: {
      english: "Which number comes next? 2, 6, 12, 20, 30, ?",
      hindi: "अगली संख्या कौन-सी होगी? 2, 6, 12, 20, 30, ?",
      hinglish: "Agla number kaunsa hoga? 2, 6, 12, 20, 30, ?"
    },
    options: {
      english: ["40", "42", "44", "46"],
      hindi: ["40", "42", "44", "46"],
      hinglish: ["40", "42", "44", "46"]
    },
    answer: 1,
    difficulty: "Easy"
  },
  {
    q: {
      english: "If all Bloops are Razzies and all Razzies are Lazzies, which must be true?",
      hindi: "यदि सभी Bloops, Razzies हैं और सभी Razzies, Lazzies हैं, तो क्या सही होना आवश्यक है?",
      hinglish: "Agar sabhi Bloops, Razzies hain aur sabhi Razzies, Lazzies hain, toh kya zaroor true hoga?"
    },
    options: {
      english: [
        "All Bloops are Lazzies",
        "All Lazzies are Bloops",
        "No Bloops are Lazzies",
        "Some Lazzies are not Razzies"
      ],
      hindi: [
        "सभी Bloops, Lazzies हैं",
        "सभी Lazzies, Bloops हैं",
        "कोई Bloop, Lazzies नहीं है",
        "कुछ Lazzies, Razzies नहीं हैं"
      ],
      hinglish: [
        "Sabhi Bloops, Lazzies hain",
        "Sabhi Lazzies, Bloops hain",
        "Koi Bloop, Lazzies nahi hai",
        "Kuch Lazzies, Razzies nahi hain"
      ]
    },
    answer: 0,
    difficulty: "Easy"
  },
  {
    q: {
      english: "A clock shows 3:15. What is the smaller angle between the hands?",
      hindi: "घड़ी में 3:15 बज रहे हैं। दोनों सुइयों के बीच छोटा कोण कितना है?",
      hinglish: "Clock mein 3:15 baj rahe hain. Dono hands ke beech chhota angle kitna hai?"
    },
    options: {
      english: ["0°", "7.5°", "15°", "30°"],
      hindi: ["0°", "7.5°", "15°", "30°"],
      hinglish: ["0°", "7.5°", "15°", "30°"]
    },
    answer: 1,
    difficulty: "Easy"
  },
  {
    q: {
      english: "If CAT = 24 and DOG = 26 using A=1, B=2... what is BIRD?",
      hindi: "यदि A=1, B=2... के अनुसार CAT = 24 और DOG = 26 है, तो BIRD क्या होगा?",
      hinglish: "A=1, B=2... ke hisaab se CAT = 24 aur DOG = 26 hai, toh BIRD kya hoga?"
    },
    options: {
      english: ["31", "33", "35", "37"],
      hindi: ["31", "33", "35", "37"],
      hinglish: ["31", "33", "35", "37"]
    },
    answer: 1,
    difficulty: "Easy"
  },

  {
    q: {
      english: "Find the missing number: 3, 9, 27, 81, ?",
      hindi: "लुप्त संख्या ज्ञात करें: 3, 9, 27, 81, ?",
      hinglish: "Missing number nikalo: 3, 9, 27, 81, ?"
    },
    options: {
      english: ["162", "189", "243", "324"],
      hindi: ["162", "189", "243", "324"],
      hinglish: ["162", "189", "243", "324"]
    },
    answer: 2,
    difficulty: "Hard"
  },
  {
    q: {
      english: "A farmer has 17 sheep. All but 9 run away. How many remain?",
      hindi: "एक किसान के पास 17 भेड़ें हैं। 9 को छोड़कर बाकी सभी भाग जाती हैं। कितनी बचीं?",
      hinglish: "Ek farmer ke paas 17 sheep hain. 9 ko chhodkar baaki sab bhaag gayi. Kitni bachi?"
    },
    options: {
      english: ["8", "9", "17", "26"],
      hindi: ["8", "9", "17", "26"],
      hinglish: ["8", "9", "17", "26"]
    },
    answer: 1,
    difficulty: "Hard"
  },
  {
    q: {
      english: "If MONDAY is coded as 1234567, how would DAY be coded?",
      hindi: "यदि MONDAY को 1234567 के रूप में कोड किया गया है, तो DAY कैसे कोड होगा?",
      hinglish: "Agar MONDAY ko 1234567 code kiya gaya hai, toh DAY ka code kya hoga?"
    },
    options: {
      english: ["567", "5671", "671", "712"],
      hindi: ["567", "5671", "671", "712"],
      hinglish: ["567", "5671", "671", "712"]
    },
    answer: 0,
    difficulty: "Hard"
  },
  {
    q: {
      english: "Which number does not belong? 16, 25, 36, 49, 63, 81",
      hindi: "इनमें से कौन-सी संख्या अलग है? 16, 25, 36, 49, 63, 81",
      hinglish: "Inmein se kaunsa number alag hai? 16, 25, 36, 49, 63, 81"
    },
    options: {
      english: ["25", "36", "63", "81"],
      hindi: ["25", "36", "63", "81"],
      hinglish: ["25", "36", "63", "81"]
    },
    answer: 2,
    difficulty: "Hard"
  },
  {
    q: {
      english: "A train travels 60 km in 45 minutes. At the same speed, how far in 2 hours?",
      hindi: "एक ट्रेन 45 मिनट में 60 किमी चलती है। उसी गति से 2 घंटे में कितनी दूरी तय करेगी?",
      hinglish: "Ek train 45 minutes mein 60 km chalti hai. Same speed par 2 hours mein kitni distance jayegi?"
    },
    options: {
      english: ["120 km", "140 km", "160 km", "180 km"],
      hindi: ["120 किमी", "140 किमी", "160 किमी", "180 किमी"],
      hinglish: ["120 km", "140 km", "160 km", "180 km"]
    },
    answer: 2,
    difficulty: "Hard"
  },

  {
    q: {
      english: "What comes next? 1, 1, 2, 3, 5, 8, 13, ?",
      hindi: "अगला क्या आएगा? 1, 1, 2, 3, 5, 8, 13, ?",
      hinglish: "Agla kya aayega? 1, 1, 2, 3, 5, 8, 13, ?"
    },
    options: {
      english: ["18", "20", "21", "24"],
      hindi: ["18", "20", "21", "24"],
      hinglish: ["18", "20", "21", "24"]
    },
    answer: 2,
    difficulty: "Very Hard"
  },
  {
    q: {
      english: "If 5 machines make 5 items in 5 minutes, how long would 100 machines take to make 100 items?",
      hindi: "यदि 5 मशीनें 5 मिनट में 5 वस्तुएँ बनाती हैं, तो 100 मशीनें 100 वस्तुएँ कितने समय में बनाएंगी?",
      hinglish: "Agar 5 machines 5 minutes mein 5 items banati hain, toh 100 machines 100 items kitne time mein banayengi?"
    },
    options: {
      english: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"],
      hindi: ["5 मिनट", "20 मिनट", "100 मिनट", "500 मिनट"],
      hinglish: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"]
    },
    answer: 0,
    difficulty: "Very Hard"
  },
  {
    q: {
      english: "A sequence follows: 2, 5, 11, 23, 47, ?. What comes next?",
      hindi: "एक श्रृंखला है: 2, 5, 11, 23, 47, ?. अगला क्या होगा?",
      hinglish: "Sequence hai: 2, 5, 11, 23, 47, ?. Agla kya hoga?"
    },
    options: {
      english: ["91", "94", "95", "97"],
      hindi: ["91", "94", "95", "97"],
      hinglish: ["91", "94", "95", "97"]
    },
    answer: 2,
    difficulty: "Very Hard"
  },
  {
    q: {
      english: "A man faces North. He turns right, then right, then left. Which direction is he facing?",
      hindi: "एक व्यक्ति उत्तर की ओर देख रहा है। वह दाएँ, फिर दाएँ और फिर बाएँ मुड़ता है। अब वह किस दिशा में है?",
      hinglish: "Ek aadmi North ki taraf face kar raha hai. Woh right, phir right aur phir left turn karta hai. Ab woh kis direction mein hai?"
    },
    options: {
      english: ["North", "South", "East", "West"],
      hindi: ["उत्तर", "दक्षिण", "पूर्व", "पश्चिम"],
      hinglish: ["North", "South", "East", "West"]
    },
    answer: 2,
    difficulty: "Very Hard"
  },
  {
    q: {
      english: "If some A are B, all B are C, and no C are D, which statement must be true?",
      hindi: "यदि कुछ A, B हैं; सभी B, C हैं; और कोई C, D नहीं है, तो कौन-सा कथन आवश्यक रूप से सही है?",
      hinglish: "Agar kuch A, B hain; sabhi B, C hain; aur koi C, D nahi hai, toh kaunsa statement zaroor true hai?"
    },
    options: {
      english: [
        "Some A are C",
        "All A are C",
        "Some A are D",
        "No A are B"
      ],
      hindi: [
        "कुछ A, C हैं",
        "सभी A, C हैं",
        "कुछ A, D हैं",
        "कोई A, B नहीं है"
      ],
      hinglish: [
        "Kuch A, C hain",
        "Sabhi A, C hain",
        "Kuch A, D hain",
        "Koi A, B nahi hai"
      ]
    },
    answer: 0,
    difficulty: "Very Hard"
  },

  {
    q: {
      english: "Three switches control three bulbs in another room. You may enter the room only once. How can you identify each switch?",
      hindi: "तीन स्विच दूसरे कमरे में तीन बल्ब नियंत्रित करते हैं। आप कमरे में केवल एक बार जा सकते हैं। हर स्विच की पहचान कैसे करेंगे?",
      hinglish: "Teen switches doosre room ke teen bulbs ko control karte hain. Aap room mein sirf ek baar ja sakte ho. Har switch ko kaise identify karoge?"
    },
    options: {
      english: [
        "Turn all switches on",
        "Use heat and light by switching one on, one briefly on, then off",
        "Turn all switches off",
        "Impossible"
      ],
      hindi: [
        "सभी स्विच चालू करें",
        "गर्मी और रोशनी का उपयोग करें: एक चालू रखें, एक थोड़ी देर चालू करके बंद करें",
        "सभी स्विच बंद करें",
        "असंभव है"
      ],
      hinglish: [
        "Sabhi switches ON kar do",
        "Heat aur light use karo: ek ON rakho, ek ko thodi der ON karke OFF karo",
        "Sabhi switches OFF kar do",
        "Impossible hai"
      ]
    },
    answer: 1,
    difficulty: "Extreme"
  },
  {
    q: {
      english: "A father is 4 times as old as his son. In 20 years he will be twice as old. How old is the son now?",
      hindi: "एक पिता अपने बेटे से 4 गुना बड़ा है। 20 साल बाद उसकी उम्र बेटे की उम्र से दोगुनी होगी। बेटे की वर्तमान उम्र क्या है?",
      hinglish: "Ek father apne son se 4 times bada hai. 20 saal baad father ki age son se double hogi. Son ki abhi age kya hai?"
    },
    options: {
      english: ["5", "10", "15", "20"],
      hindi: ["5", "10", "15", "20"],
      hinglish: ["5", "10", "15", "20"]
    },
    answer: 1,
    difficulty: "Extreme"
  },
  {
    q: {
      english: "What number replaces ?: 4, 7, 13, 25, 49, ?",
      hindi: "प्रश्नचिह्न की जगह कौन-सी संख्या आएगी? 4, 7, 13, 25, 49, ?",
      hinglish: "Question mark ki jagah kaunsa number aayega? 4, 7, 13, 25, 49, ?"
    },
    options: {
      english: ["73", "85", "91", "97"],
      hindi: ["73", "85", "91", "97"],
      hinglish: ["73", "85", "91", "97"]
    },
    answer: 3,
    difficulty: "Extreme"
  },
  {
    q: {
      english: "You have 8 identical-looking balls. One is heavier. Using a balance scale only twice, what is the maximum number of balls you can always identify the heavier one from?",
      hindi: "आपके पास एक जैसी दिखने वाली 8 गेंदें हैं। एक गेंद भारी है। केवल दो बार तराजू का उपयोग करके अधिकतम कितनी गेंदों में से भारी गेंद को निश्चित रूप से पहचाना जा सकता है?",
      hinglish: "Aapke paas 8 same-looking balls hain. Ek ball heavy hai. Balance scale ko sirf 2 baar use karke maximum kitni balls mein se heavy ball ko pakka identify kar sakte ho?"
    },
    options: {
      english: ["6", "7", "8", "9"],
      hindi: ["6", "7", "8", "9"],
      hinglish: ["6", "7", "8", "9"]
    },
    answer: 2,
    difficulty: "Extreme"
  }
];

const translations = {
  english: {
    how: "How It Works",
    why: "Why IQNova",
    verify: "Certificate Verify",
    start: "Start Challenge",
    badge: "19-Question Intelligence Challenge",
    title: "Challenge the way you think.",
    desc: "Test your logical reasoning, pattern recognition, numerical thinking and problem-solving skills with the IQNova Challenge.",
    learn: "Learn More",
    noLogin: "No login required",
    questions: "19 questions",
    unlock: "One-time ₹19 unlock",
    experience: "THE IQNOVA EXPERIENCE",
    built: "Built to challenge your thinking.",
    warmup: "From easy warm-ups to extreme reasoning puzzles.",
    levels: "4 Difficulty Levels",
    levelsDesc: "Easy, Hard, Very Hard and Extreme.",
    report: "Instant Report",
    reportDesc: "Unlock your score, analysis and certificate.",
    certificate: "CERTIFICATE",
    verifyTitle: "Verify an IQNova certificate.",
    verifyDesc: "Check a certificate using its unique Certificate ID.",
    verifyBtn: "Verify Certificate",
    before: "Before we begin.",
    details: "Enter your details to start the 19-question challenge.",
    name: "Full Name",
    age: "Age",
    email: "Email",
    begin: "Start the Test",
    back: "Back",
    question: "Question",
    next: "Next Question",
    finish: "Complete Challenge",
    complete: "CHALLENGE COMPLETE",
    resultReady: "Your result is ready.",
    resultDesc: "You completed all 19 questions. Your full score, detailed analysis and certificate will be unlocked after payment.",
    fullUnlock: "One-time full result unlock",
    unlockResult: "Unlock Full Result",
    footer: "IQNova is an educational intelligence challenge and is not a clinically validated IQ assessment."
  },

  hindi: {
    how: "यह कैसे काम करता है",
    why: "IQNova क्यों",
    verify: "सर्टिफिकेट सत्यापित करें",
    start: "चैलेंज शुरू करें",
    badge: "19 प्रश्नों की बुद्धिमत्ता चुनौती",
    title: "अपनी सोच को चुनौती दें।",
    desc: "IQNova Challenge के साथ अपनी तार्किक सोच, पैटर्न पहचान, संख्यात्मक सोच और समस्या-समाधान कौशल को परखें।",
    learn: "और जानें",
    noLogin: "लॉगिन की जरूरत नहीं",
    questions: "19 प्रश्न",
    unlock: "एक बार ₹19 में अनलॉक",
    experience: "IQNOVA का अनुभव",
    built: "आपकी सोच को चुनौती देने के लिए बनाया गया।",
    warmup: "आसान शुरुआत से लेकर कठिन तर्क पहेलियों तक।",
    levels: "4 कठिनाई स्तर",
    levelsDesc: "आसान, कठिन, बहुत कठिन और अत्यंत कठिन।",
    report: "तुरंत रिपोर्ट",
    reportDesc: "अपना स्कोर, विश्लेषण और सर्टिफिकेट अनलॉक करें।",
    certificate: "सर्टिफिकेट",
    verifyTitle: "IQNova सर्टिफिकेट सत्यापित करें।",
    verifyDesc: "अपने यूनिक Certificate ID से सर्टिफिकेट चेक करें।",
    verifyBtn: "सर्टिफिकेट सत्यापित करें",
    before: "शुरू करने से पहले।",
    details: "19 प्रश्नों की चुनौती शुरू करने के लिए अपनी जानकारी भरें।",
    name: "पूरा नाम",
    age: "उम्र",
    email: "ईमेल",
    begin: "टेस्ट शुरू करें",
    back: "वापस",
    question: "प्रश्न",
    next: "अगला प्रश्न",
    finish: "चैलेंज पूरा करें",
    complete: "चैलेंज पूरा हुआ",
    resultReady: "आपका परिणाम तैयार है।",
    resultDesc: "आपने सभी 19 प्रश्न पूरे कर लिए हैं। आपका पूरा स्कोर, विस्तृत विश्लेषण और सर्टिफिकेट भुगतान के बाद अनलॉक होगा।",
    fullUnlock: "एक बार में पूरा परिणाम अनलॉक",
    unlockResult: "पूरा परिणाम अनलॉक करें",
    footer: "IQNova एक शैक्षिक बुद्धिमत्ता चुनौती है और यह clinically validated IQ assessment नहीं है।"
  },

  hinglish: {
    how: "Kaise Kaam Karta Hai",
    why: "IQNova Kyun",
    verify: "Certificate Verify",
    start: "Challenge Start Karo",
    badge: "19-Question Intelligence Challenge",
    title: "Apni thinking ko challenge karo.",
    desc: "IQNova Challenge ke saath apni logical reasoning, pattern recognition, numerical thinking aur problem-solving skills test karo.",
    learn: "Aur Jaano",
    noLogin: "Login ki zarurat nahi",
    questions: "19 questions",
    unlock: "One-time ₹19 unlock",
    experience: "THE IQNOVA EXPERIENCE",
    built: "Tumhari thinking ko challenge karne ke liye banaya gaya.",
    warmup: "Easy warm-up se lekar extreme reasoning puzzles tak.",
    levels: "4 Difficulty Levels",
    levelsDesc: "Easy, Hard, Very Hard aur Extreme.",
    report: "Instant Report",
    reportDesc: "Apna score, analysis aur certificate unlock karo.",
    certificate: "CERTIFICATE",
    verifyTitle: "IQNova certificate verify karo.",
    verifyDesc: "Unique Certificate ID se certificate check karo.",
    verifyBtn: "Certificate Verify Karo",
    before: "Shuru karne se pehle.",
    details: "19-question challenge start karne ke liye apni details bharo.",
    name: "Full Name",
    age: "Age",
    email: "Email",
    begin: "Test Shuru Karo",
    back: "Back",
    question: "Question",
    next: "Next Question",
    finish: "Challenge Complete Karo",
    complete: "CHALLENGE COMPLETE",
    resultReady: "Tumhara result ready hai.",
    resultDesc: "Tumne saare 19 questions complete kar liye hain. Full score, detailed analysis aur certificate payment ke baad unlock hoga.",
    fullUnlock: "One-time full result unlock",
    unlockResult: "Full Result Unlock Karo",
    footer: "IQNova ek educational intelligence challenge hai, clinically validated IQ assessment nahi hai."
  }
};

function App() {
  const [page, setPage] = useState("home");
  const [language, setLanguage] = useState("hinglish");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [student, setStudent] = useState({
    name: "",
    age: "",
    email: ""
  });

  const [sessionId, setSessionId] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentPaid, setPaymentPaid] = useState(false);

  const t = translations[language];
  const currentQuestion = questions[current];

  const selectAnswer = (index) => {
    setAnswers((prev) => ({
      ...prev,
      [current]: index
    }));
  };

  const startChallenge = () => {
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

    setCurrent(0);
    setAnswers({});
    setPage("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const unlockResult = async () => {
  try {
    setPaymentLoading(true);

    const newSessionId =
      sessionId ||
      `IQNOVA-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

    setSessionId(newSessionId);

    const response = await fetch(
      "http://localhost:3001/api/payment/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          name: student.name,
          email: student.email,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Payment link create nahi hua");
    }

    window.open(data.shortUrl, "_blank");
    const checkPayment = async () => {
  try {
    const response = await fetch(
      `http://localhost:3001/api/payment/status/${newSessionId}`
    );

    const data = await response.json();

    if (data.success && data.paid) {
      setPaymentPaid(true);
      alert(
        language === "hindi"
          ? "Payment successful! Aapka result unlock ho gaya hai."
          : language === "english"
            ? "Payment successful! Your result is unlocked."
            : "Payment successful! Tumhara result unlock ho gaya hai."
      );
    }
  } catch (error) {
    console.error("Payment check error:", error);
  }
};

const paymentTimer = setInterval(async () => {
  await checkPayment();
}, 3000);

setTimeout(() => {
  clearInterval(paymentTimer);
}, 10 * 60 * 1000);
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

  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <button className="logo" onClick={() => setPage("home")}>
          <div className="logo-mark">IQ</div>
          <span>IQNova</span>
        </button>

        <div className="nav-links">
          <a href="#how">{t.how}</a>
          <a href="#why">{t.why}</a>
          <a href="#verify">{t.verify}</a>
        </div>

        <div className="nav-right">

          {/* LANGUAGE SWITCHER */}
          <div className="language-switcher">
            <button
              className={language === "english" ? "active" : ""}
              onClick={() => setLanguage("english")}
            >
              English
            </button>

            <button
              className={language === "hindi" ? "active" : ""}
              onClick={() => setLanguage("hindi")}
            >
              हिंदी
            </button>

            <button
              className={language === "hinglish" ? "active" : ""}
              onClick={() => setLanguage("hinglish")}
            >
              Hinglish
            </button>
          </div>

          <button
            className="nav-cta"
            onClick={() => setPage("start")}
          >
            {t.start}
          </button>
        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <>
          <main className="hero">

            <div className="hero-content">

              <div className="badge">
                <span>✦</span>
                {t.badge}
              </div>

              <h1>
                {language === "english" && (
                  <>
                    Challenge the way
                    <br />
                    <span>you think.</span>
                  </>
                )}

                {language === "hindi" && (
                  <>
                    अपनी सोच को
                    <br />
                    <span>चुनौती दें।</span>
                  </>
                )}

                {language === "hinglish" && (
                  <>
                    Apni thinking ko
                    <br />
                    <span>challenge karo.</span>
                  </>
                )}
              </h1>

              <p>{t.desc}</p>

              <div className="hero-buttons">
                <button
                  className="primary-button"
                  onClick={() => setPage("start")}
                >
                  {t.start}
                  <span>→</span>
                </button>

                <a className="secondary-button" href="#how">
                  {t.learn}
                </a>
              </div>

              <div className="trust-line">
                <div><span>✓</span>{t.noLogin}</div>
                <div><span>✓</span>{t.questions}</div>
                <div><span>✓</span>{t.unlock}</div>
              </div>

            </div>

            {/* PREMIUM CARD */}
            <div className="hero-card">
              <div className="card-shine"></div>

              <div className="brain-icon">IQ</div>

              <div className="mini-label">IQNOVA</div>

              <h2>IQ Challenge</h2>

              <div className="score-preview">
                <div>
                  <strong>19</strong>
                  <span>{language === "hindi" ? "प्रश्न" : "Questions"}</span>
                </div>

                <div>
                  <strong>100</strong>
                  <span>{language === "hindi" ? "अधिकतम स्कोर" : "Max Score"}</span>
                </div>
              </div>

              <div className="difficulty">
                <span>Easy</span>
                <span>Hard</span>
                <span>Very Hard</span>
                <span>Extreme</span>
              </div>

              <div className="card-footer">
                <span>IQNOVA</span>
                <span>01 — 19</span>
              </div>
            </div>

          </main>

          <section className="features" id="how">

            <div className="section-heading">
              <p>{t.experience}</p>
              <h2>{t.built}</h2>
            </div>

            <div className="feature-grid">

              <div className="feature-card">
                <div className="feature-number">01</div>
                <div className="feature-icon">◈</div>
                <h3>{language === "hindi" ? "19 प्रश्न" : "19 Questions"}</h3>
                <p>{t.warmup}</p>
              </div>

              <div className="feature-card">
                <div className="feature-number">02</div>
                <div className="feature-icon">◇</div>
                <h3>{t.levels}</h3>
                <p>{t.levelsDesc}</p>
              </div>

              <div className="feature-card">
                <div className="feature-number">03</div>
                <div className="feature-icon">✦</div>
                <h3>{t.report}</h3>
                <p>{t.reportDesc}</p>
              </div>

            </div>
          </section>

          <section className="verify-section" id="verify">
            <div>
              <div className="mini-label">{t.certificate}</div>
              <h2>{t.verifyTitle}</h2>
              <p>{t.verifyDesc}</p>
            </div>

            <button className="secondary-button">
              {t.verifyBtn} →
            </button>
          </section>

          <footer id="why">
            <div className="logo">
              <div className="logo-mark">IQ</div>
              <span>IQNova</span>
            </div>

            <p>{t.footer}</p>
          </footer>
        </>
      )}

      {/* START PAGE */}
      {page === "start" && (
        <main className="start-page">

          <div className="start-box">

            <div className="badge">IQNOVA — IQ CHALLENGE</div>

            <h1>{t.before}</h1>

            <p>{t.details}</p>

            <div className="form-grid">

              <label>
                {t.name}
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) =>
                    setStudent({
                      ...student,
                      name: e.target.value
                    })
                  }
                  placeholder={t.name}
                />
              </label>

              <label>
                {t.age}
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={student.age}
                  onChange={(e) =>
                    setStudent({
                      ...student,
                      age: e.target.value
                    })
                  }
                  placeholder={t.age}
                />
              </label>

              <label className="full-width">
                {t.email}
                <input
                  type="email"
                  value={student.email}
                  onChange={(e) =>
                    setStudent({
                      ...student,
                      email: e.target.value
                    })
                  }
                  placeholder={t.email}
                />
              </label>

            </div>

            <div className="start-actions">

              <button
                className="secondary-button"
                onClick={() => setPage("home")}
              >
                ← {t.back}
              </button>

              <button
                className="primary-button"
                onClick={startChallenge}
              >
                {t.begin}
                <span>→</span>
              </button>

            </div>

          </div>

        </main>
      )}

      {/* QUIZ */}
      {page === "quiz" && (
        <main className="quiz-page">

          <div className="quiz-top">
            <span>
              {t.question} {current + 1} / 19
            </span>

            <span className={`difficulty-label ${currentQuestion.difficulty.toLowerCase().replace(" ", "-")}`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <div className="progress">
            <div
              style={{
                width: `${((current + 1) / 19) * 100}%`
              }}
            />
          </div>

          <div className="question-card">

            <div className="question-header">
              <div className="question-number">
                {String(current + 1).padStart(2, "0")}
              </div>

              <span>
                {currentQuestion.difficulty}
              </span>
            </div>

            <h1>
              {currentQuestion.q[language]}
            </h1>

            <div className="options">

              {currentQuestion.options[language].map(
                (option, index) => (
                  <button
                    key={index}
                    className={
                      answers[current] === index
                        ? "option selected"
                        : "option"
                    }
                    onClick={() => selectAnswer(index)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                )
              )}

            </div>

            <button
              className="primary-button next-button"
              disabled={answers[current] === undefined}
              onClick={nextQuestion}
            >
              {current === 18 ? t.finish : t.next}
              <span>→</span>
            </button>

          </div>

        </main>
      )}

      {/* RESULT */}
      {page === "result" && (
        <main className="start-page">

          <div className="start-box result-box">

            <div className="badge">
              {t.complete}
            </div>

            <h1>{t.resultReady}</h1>

            <p>{t.resultDesc}</p>

            <div className="locked-result">
              <strong>₹19</strong>
              <span>{t.fullUnlock}</span>
            </div>

            <button
  className="primary-button"
  onClick={unlockResult}
  disabled={paymentLoading}
>
  {paymentLoading
    ? language === "hindi"
      ? "Payment Link Ban Raha Hai..."
      : language === "english"
        ? "Creating Payment Link..."
        : "Payment Link Ban Raha Hai..."
    : t.unlockResult}
  <span>→</span>
</button>

          </div>

        </main>
      )}

    </div>
  );
}

export default App;