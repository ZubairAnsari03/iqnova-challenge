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

const QUESTION_COUNT = 15;

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

const INTEREST_CATEGORY_MAP = {

  "📚 Education & Study": "Education",

  "📱 Social Media": "Social Media",

  "🏏 Cricket & Sports": "Cricket & Sports",

  "🎬 Movies & Entertainment": "Movies & Entertainment",

  "🌍 World & Politics": "World & Politics",

  "❤️ Relationship & Social Situations": "Relationship",

  "🧠 Quiz & General Knowledge": "Quiz & General Knowledge",

  "🧩 Puzzle & Mathematics": "Puzzle & Mathematics",

};

const QUESTION_BANK = [

// 📚 EDUCATION & STUDY

  ...[

    ["E01","Easy","What is 20% of 100?","100 का 20% कितना है?","100 ka 20% kitna hai?",["10","20","25","30"],1],

    ["E02","Easy","How many days are there in a week?","एक सप्ताह में कितने दिन होते हैं?","Ek week mein kitne din hote hain?",["5","6","7","8"],2],

    ["E03","Easy","Which method uses short focused study sessions with breaks?","कौन-सी विधि छोटे केंद्रित अध्ययन सत्रों और बीच-बीच में विराम का उपयोग करती है?","Kaunsi method short focused study sessions aur breaks use karti hai?",["Pomodoro","Random Study","Speed Reading","Night Shift"],0],

    ["E04","Hard","If a student scores 72 out of 90, what is the percentage?","यदि किसी विद्यार्थी को 90 में से 72 अंक मिले, तो प्रतिशत कितना है?","Agar student ko 90 mein se 72 marks mile, to percentage kitni hai?",["70%","75%","80%","85%"],2],

    ["E05","Hard","A book has 240 pages. If you read 30 pages daily, how many days will it take?","एक पुस्तक में 240 पृष्ठ हैं। यदि आप प्रतिदिन 30 पृष्ठ पढ़ते हैं, तो कितने दिन लगेंगे?","Book mein 240 pages hain. Roz 30 pages padho to kitne din lagenge?",["6","8","10","12"],1],

    ["E06","Hard","What is the average of 60, 70 and 80?","60, 70 और 80 का औसत कितना है?","60, 70 aur 80 ka average kitna hai?",["65","70","75","80"],1],

    ["E07","Very Hard","If 25% of a number is 45, what is the number?","किसी संख्या का 25% 45 है। वह संख्या क्या है?","Kisi number ka 25% 45 hai. Number kya hai?",["120","160","180","200"],2],

    ["E08","Very Hard","A student improves from 60 to 75 marks. What is the increase?","एक विद्यार्थी के अंक 60 से बढ़कर 75 हो गए। वृद्धि कितनी हुई?","Student ke marks 60 se 75 ho gaye. Increase kitna hua?",["10","15","20","25"],1],

    ["E09","Very Hard","If 3 notebooks cost ₹180, what is the cost of 7 notebooks?","यदि 3 कॉपियों की कीमत ₹180 है, तो 7 कॉपियों की कीमत कितनी होगी?","Agar 3 notebooks ₹180 ki hain, to 7 notebooks kitne ki hongi?",["₹360","₹400","₹420","₹450"],2],

    ["E10","Extreme","A test has 50 questions. A student gets 42 correct. What percentage is correct?","एक परीक्षा में 50 प्रश्न हैं। विद्यार्थी ने 42 सही किए। सही उत्तरों का प्रतिशत कितना है?","Test mein 50 questions hain aur 42 correct hain. Correct percentage kitni hai?",["76%","80%","84%","88%"],2],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Education", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// 📱 SOCIAL MEDIA

  ...[

    ["S01","Easy","What does a like usually indicate on social media?","सोशल मीडिया पर लाइक आमतौर पर क्या दर्शाता है?","Social media par like usually kya show karta hai?",["Engagement","Password","Location","Username"],0],

    ["S02","Easy","What is a hashtag mainly used for?","हैशटैग का मुख्य रूप से उपयोग किस लिए किया जाता है?","Hashtag mainly kis kaam aata hai?",["Discovering related content","Changing password","Calling someone","Editing photos"],0],

    ["S03","Easy","If a Reel gets 1,000 views and 100 likes, what is the like rate?","यदि किसी रील को 1,000 व्यूज़ और 100 लाइक मिलते हैं, तो लाइक दर कितनी है?","Reel ko 1,000 views aur 100 likes mile. Like rate kitna hai?",["5%","10%","15%","20%"],1],

    ["S04","Hard","A post gets 500 likes from 5,000 followers. What percentage of followers liked it?","5,000 फॉलोअर्स में से 500 ने पोस्ट को लाइक किया। कितने प्रतिशत फॉलोअर्स ने लाइक किया?","5,000 followers mein se 500 ne like kiya. Kitne percent followers ne like kiya?",["5%","10%","15%","20%"],1],

    ["S05","Hard","What does engagement generally include?","एंगेजमेंट में आमतौर पर क्या शामिल होता है?","Engagement mein generally kya include hota hai?",["Likes, comments and shares","Only followers","Only passwords","Only profile visits"],0],

    ["S06","Hard","A video gets 20,000 views and 5% viewers like it. How many likes?","किसी वीडियो को 20,000 व्यूज़ मिले और 5% दर्शकों ने लाइक किया। कितने लाइक हुए?","Video ko 20,000 views mile aur 5% ne like kiya. Kitne likes hue?",["500","750","1,000","1,500"],2],

    ["S07","Very Hard","A post gets 2,000 likes and 200 comments. What is the combined engagement count?","किसी पोस्ट को 2,000 लाइक और 200 कमेंट मिले। कुल एंगेजमेंट कितना है?","Post ko 2,000 likes aur 200 comments mile. Total engagement kitna hai?",["2,000","2,100","2,200","2,400"],2],

    ["S08","Very Hard","A creator has 10,000 followers and gains 15%. How many new followers?","किसी क्रिएटर के 10,000 फॉलोअर्स हैं और 15% वृद्धि होती है। नए फॉलोअर्स कितने होंगे?","Creator ke 10,000 followers hain aur 15% growth hoti hai. New followers kitne honge?",["1,000","1,500","2,000","2,500"],1],

    ["S09","Very Hard","A Reel gets 40,000 views. If 2.5% viewers share it, how many shares?","रील को 40,000 व्यूज़ मिले। यदि 2.5% दर्शक उसे शेयर करते हैं, तो कितने शेयर होंगे?","Reel ko 40,000 views mile. 2.5% log share karein to kitne shares honge?",["500","750","1,000","1,250"],2],

    ["S10","Extreme","A page grows from 20,000 to 26,000 followers. What is the growth percentage?","किसी पेज के फॉलोअर्स 20,000 से बढ़कर 26,000 हो गए। वृद्धि प्रतिशत कितना है?","Page followers 20,000 se 26,000 ho gaye. Growth percentage kitni hai?",["20%","25%","30%","35%"],2],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Social Media", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// 🏏 CRICKET & SPORTS

  ...[

    ["C01","Easy","How many legal balls are there in a cricket over?","क्रिकेट के एक ओवर में कितनी वैध गेंदें होती हैं?","Cricket ke ek over mein kitni legal balls hoti hain?",["4","5","6","8"],2],

    ["C02","Easy","How many players are on the field for one cricket team?","क्रिकेट की एक टीम के कितने खिलाड़ी मैदान पर होते हैं?","Cricket team ke kitne players field par hote hain?",["9","10","11","12"],2],

    ["C03","Easy","If a batter scores 4 and then 6, how many runs?","यदि बल्लेबाज़ 4 और फिर 6 रन बनाता है, तो कुल कितने रन होंगे?","Batter 4 aur phir 6 runs banata hai. Total kitne runs?",["8","9","10","12"],2],

    ["C04","Hard","A team needs 60 runs from 30 balls. What run rate is required?","एक टीम को 30 गेंदों में 60 रन चाहिए। आवश्यक रन रेट क्या होगा?","Team ko 30 balls mein 60 runs chahiye. Required run rate kya hoga?",["1","2","3","4"],1],

    ["C05","Hard","A batter scores 35, 45 and 20 in three matches. What is the average?","एक बल्लेबाज़ तीन मैचों में 35, 45 और 20 रन बनाता है। औसत कितना है?","Batter 3 matches mein 35, 45 aur 20 runs banata hai. Average kya hai?",["30","33.33","35","40"],1],

    ["C06","Hard","How many points does a win give in many standard league formats?","कई मानक लीग प्रारूपों में जीत के लिए कितने अंक दिए जाते हैं?","Kai standard league formats mein win ke liye kitne points milte hain?",["1","2","3","4"],2],

    ["C07","Very Hard","A team scores 180 runs in 20 overs. What is the run rate?","एक टीम 20 ओवर में 180 रन बनाती है। रन रेट कितना है?","Team 20 overs mein 180 runs banati hai. Run rate kitna hai?",["7","8","9","10"],2],

    ["C08","Very Hard","A batter needs 24 runs from 12 balls. What is the required run rate per over?","एक बल्लेबाज़ को 12 गेंदों में 24 रन चाहिए। आवश्यक रन रेट प्रति ओवर कितना है?","Batter ko 12 balls mein 24 runs chahiye. Required run rate per over kitna hai?",["8","10","12","14"],2],

    ["C09","Very Hard","A team scores 96 runs in 8 overs. What is its run rate?","एक टीम 8 ओवर में 96 रन बनाती है। उसका रन रेट कितना है?","Team 8 overs mein 96 runs banati hai. Run rate kitna hai?",["10","12","14","16"],1],

    ["C10","Extreme","A batter scores 42, 68, 35, 91 and 64. What is the average?","एक बल्लेबाज़ 42, 68, 35, 91 और 64 रन बनाता है। औसत कितना है?","Batter 42, 68, 35, 91 aur 64 runs banata hai. Average kitna hai?",["58","60","62","64"],1],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Cricket & Sports", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// 🎬 MOVIES & ENTERTAINMENT

  ...[

    ["M01","Easy","What is a sequel?","सीक्वल क्या होता है?","Sequel kya hota hai?",["A continuation of a story","A trailer","A poster","A soundtrack"],0],

    ["M02","Easy","What is a movie trailer mainly used for?","फिल्म का ट्रेलर मुख्य रूप से किस लिए होता है?","Movie trailer mainly kis liye hota hai?",["Promoting the movie","Changing the ending","Recording sound","Selling tickets only"],0],

    ["M03","Easy","How many minutes are in 2 hours?","2 घंटे में कितने मिनट होते हैं?","2 hours mein kitne minutes hote hain?",["60","90","120","150"],2],

    ["M04","Hard","A movie is 150 minutes long. How many hours and minutes is that?","एक फिल्म 150 मिनट लंबी है। यह कितने घंटे और मिनट हैं?","Movie 150 minutes ki hai. Ye kitne hours aur minutes hain?",["2h 10m","2h 20m","2h 30m","3h"],2],

    ["M05","Hard","A cinema has 400 seats and 75% are occupied. How many are occupied?","सिनेमा हॉल में 400 सीटें हैं और 75% भरी हुई हैं। कितनी सीटें भरी हैं?","Cinema mein 400 seats hain aur 75% occupied hain. Kitni seats occupied hain?",["250","300","325","350"],1],

    ["M06","Hard","A film earns ₹120 crore on a ₹80 crore budget. How much is the profit before other costs?","फिल्म ₹80 करोड़ के बजट पर ₹120 करोड़ कमाती है। अन्य लागतों से पहले लाभ कितना है?","Film ka budget ₹80 crore aur earning ₹120 crore hai. Other costs se pehle profit kitna hai?",["₹20 crore","₹30 crore","₹40 crore","₹50 crore"],2],

    ["M07","Very Hard","A theatre has 12 rows with 25 seats each. Total seats?","एक थिएटर में 12 पंक्तियाँ हैं और हर पंक्ति में 25 सीटें हैं। कुल सीटें कितनी हैं?","Theatre mein 12 rows hain aur har row mein 25 seats hain. Total seats?",["250","275","300","325"],2],

    ["M08","Very Hard","A movie ticket costs ₹250. What is the cost of 8 tickets?","एक फिल्म टिकट की कीमत ₹250 है। 8 टिकटों की कीमत कितनी होगी?","Movie ticket ₹250 ka hai. 8 tickets ki cost kitni hogi?",["₹1,500","₹1,750","₹2,000","₹2,250"],2],

    ["M09","Very Hard","A film's collection rises from ₹100 crore to ₹150 crore. What is the increase percentage?","फिल्म का कलेक्शन ₹100 करोड़ से बढ़कर ₹150 करोड़ हो गया। वृद्धि प्रतिशत कितना है?","Film collection ₹100 crore se ₹150 crore ho gaya. Increase percentage kitni hai?",["25%","40%","50%","75%"],2],

    ["M10","Extreme","A theatre sells 360 tickets at ₹250 each. Total revenue?","एक थिएटर ₹250 प्रति टिकट की दर से 360 टिकट बेचता है। कुल आय कितनी है?","Theatre 360 tickets ₹250 each par sell karta hai. Total revenue kitna hai?",["₹80,000","₹90,000","₹95,000","₹1,00,000"],1],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Movies & Entertainment", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// 🌍 WORLD & POLITICS

  ...[

    ["W01","Easy","What is the capital of India?","भारत की राजधानी क्या है?","India ki capital kya hai?",["Mumbai","New Delhi","Kolkata","Chennai"],1],

    ["W02","Easy","Where is the headquarters of the United Nations?","संयुक्त राष्ट्र का मुख्यालय कहाँ है?","United Nations ka headquarters kahan hai?",["London","New York City","Paris","Rome"],1],

    ["W03","Easy","What are the two houses of the Indian Parliament?","भारतीय संसद के दो सदन कौन-से हैं?","Indian Parliament ke do houses kaun-se hain?",["Lok Sabha and Rajya Sabha","Vidhan Sabha and Lok Sabha","Rajya Sabha and Supreme Court","Lok Sabha and High Court"],0],

    ["W04","Hard","How many years are there in one decade?","एक दशक में कितने वर्ष होते हैं?","Ek decade mein kitne years hote hain?",["5","10","15","20"],1],

    ["W05","Hard","If a country's population rises from 50 million to 60 million, what is the increase percentage?","यदि किसी देश की जनसंख्या 5 करोड़ से बढ़कर 6 करोड़ हो जाए, तो वृद्धि प्रतिशत कितना है?","Population 5 crore se 6 crore ho jaye to increase percentage kitni hai?",["10%","15%","20%","25%"],2],

    ["W06","Hard","What is the main purpose of an election?","चुनाव का मुख्य उद्देश्य क्या है?","Election ka main purpose kya hota hai?",["Choosing representatives","Printing money","Changing weather","Making laws automatically"],0],

    ["W07","Very Hard","If 60% of 500 voters vote, how many voters is that?","500 मतदाताओं में से 60% मतदान करें, तो कितने मतदाता मतदान करेंगे?","500 voters mein 60% vote karein to kitne voters vote karenge?",["250","300","350","400"],1],

    ["W08","Very Hard","A country has 80 million people and grows by 10%. New population?","किसी देश की जनसंख्या 8 करोड़ है और 10% बढ़ती है। नई जनसंख्या कितनी होगी?","Country ki population 8 crore hai aur 10% grow hoti hai. New population kitni hogi?",["8.4 crore","8.8 crore","9 crore","9.2 crore"],1],

    ["W09","Very Hard","If 3 out of 5 representatives support a proposal, what fraction supports it?","यदि 5 में से 3 प्रतिनिधि किसी प्रस्ताव का समर्थन करते हैं, तो समर्थन का भिन्न क्या है?","5 mein se 3 representatives support karein to fraction kya hoga?",["1/5","2/5","3/5","4/5"],2],

    ["W10","Extreme","A population increases from 2 crore to 2.5 crore. What is the percentage increase?","जनसंख्या 2 करोड़ से बढ़कर 2.5 करोड़ हो जाती है। प्रतिशत वृद्धि कितनी है?","Population 2 crore se 2.5 crore ho jaye to percentage increase kitna hai?",["20%","25%","30%","50%"],1],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"World & Politics", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// ❤️ RELATIONSHIP & SOCIAL SITUATIONS

  ...[

    ["R01","Easy","What is active listening?","सक्रिय रूप से सुनना क्या है?","Active listening kya hota hai?",["Paying attention while someone speaks","Ignoring someone","Interrupting often","Changing the topic"],0],

    ["R02","Easy","What is a respectful way to handle a disagreement?","असहमति को संभालने का सम्मानजनक तरीका क्या है?","Disagreement handle karne ka respectful way kya hai?",["Calm discussion","Shouting","Insulting","Ignoring forever"],0],

    ["R03","Easy","If a friend is upset, what is usually helpful first?","यदि कोई मित्र परेशान है, तो शुरुआत में क्या मददगार होता है?","Agar friend upset hai to pehle kya helpful hota hai?",["Listening","Mocking","Arguing","Ignoring"],0],

    ["R04","Hard","Two friends misunderstand each other. What should they do?","दो दोस्तों के बीच गलतफहमी हो जाए तो उन्हें क्या करना चाहिए?","Do friends ke beech misunderstanding ho to kya karna chahiye?",["Clarify calmly","Spread rumors","Avoid forever","Blame immediately"],0],

    ["R05","Hard","Why are boundaries important in relationships?","रिश्तों में सीमाएँ क्यों महत्वपूर्ण होती हैं?","Relationships mein boundaries important kyun hoti hain?",["They define personal limits","They create confusion","They remove communication","They force agreement"],0],

    ["R06","Hard","A friend repeatedly arrives late. What is a healthy response?","कोई मित्र बार-बार देर से आता है। स्वस्थ प्रतिक्रिया क्या होगी?","Friend baar-baar late aata hai. Healthy response kya hoga?",["Communicate the concern","Insult them","Become late intentionally","Never explain"],0],

    ["R07","Very Hard","Two people disagree. What can reduce unnecessary conflict?","दो लोग असहमत हैं। अनावश्यक विवाद को कम करने के लिए क्या किया जा सकता है?","Do log disagree karte hain. Unnecessary conflict kaise reduce ho sakta hai?",["Listen and clarify","Raise voices","Assume intentions","Spread the argument"],0],

    ["R08","Very Hard","In a group decision, why should minority opinions be heard?","समूह के निर्णय में अल्पमत की राय क्यों सुनी जानी चाहिए?","Group decision mein minority opinion kyun sunni chahiye?",["It can reveal useful concerns","It always wins","It avoids all decisions","It removes discussion"],0],

    ["R09","Very Hard","What is a constructive response to criticism?","आलोचना पर रचनात्मक प्रतिक्रिया क्या है?","Criticism par constructive response kya hota hai?",["Consider the useful point","Immediately insult back","Ignore every detail","Start an argument"],0],

    ["R10","Extreme","A group has 8 members and 6 agree on a plan. What fraction agrees?","एक समूह में 8 सदस्य हैं और 6 किसी योजना से सहमत हैं। सहमति का भिन्न क्या है?","Group mein 8 members hain aur 6 agree karte hain. Fraction kya hai?",["1/2","3/4","4/5","7/8"],1],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Relationship", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// 🧠 QUIZ & GENERAL KNOWLEDGE

  ...[

    ["G01","Easy","Which is the largest planet in our Solar System?","हमारे सौरमंडल का सबसे बड़ा ग्रह कौन-सा है?","Solar System ka sabse bada planet kaunsa hai?",["Earth","Mars","Jupiter","Venus"],2],

    ["G02","Easy","What is the chemical formula of water?","पानी का रासायनिक सूत्र क्या है?","Water ka chemical formula kya hai?",["CO₂","H₂O","O₂","NaCl"],1],

    ["G03","Easy","How many continents are commonly recognized?","आमतौर पर कितने महाद्वीप माने जाते हैं?","Commonly kitne continents recognize kiye jaate hain?",["5","6","7","8"],2],

    ["G04","Hard","Which planet is known as the Red Planet?","किस ग्रह को लाल ग्रह कहा जाता है?","Kis planet ko Red Planet kaha jata hai?",["Venus","Mars","Jupiter","Mercury"],1],

    ["G05","Hard","How many degrees are in a full circle?","एक पूर्ण वृत्त में कितने डिग्री होते हैं?","Full circle mein kitne degrees hote hain?",["90°","180°","270°","360°"],3],

    ["G06","Hard","Which gas is most abundant in Earth's atmosphere?","पृथ्वी के वायुमंडल में सबसे अधिक मात्रा में कौन-सी गैस है?","Earth atmosphere mein sabse abundant gas kaunsi hai?",["Oxygen","Nitrogen","Hydrogen","Carbon dioxide"],1],

    ["G07","Very Hard","How many seconds are there in 5 minutes?","5 मिनट में कितने सेकंड होते हैं?","5 minutes mein kitne seconds hote hain?",["200","250","300","350"],2],

    ["G08","Very Hard","If one dozen costs ₹240, what is the cost of 5 items?","यदि एक दर्जन वस्तुओं की कीमत ₹240 है, तो 5 वस्तुओं की कीमत कितनी होगी?","Agar 1 dozen items ₹240 ke hain, to 5 items ki cost kitni hogi?",["₹80","₹90","₹100","₹120"],2],

    ["G09","Very Hard","What is 15% of 800?","800 का 15% कितना है?","800 ka 15% kitna hai?",["100","120","140","160"],1],

    ["G10","Extreme","A clock shows 3:00. What angle is between the hands?","घड़ी में 3:00 बजे हैं। दोनों सुइयों के बीच कोण कितना है?","Clock mein 3:00 baj rahe hain. Hands ke beech angle kitna hai?",["45°","60°","90°","120°"],2],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Quiz & General Knowledge", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

// 🧩 PUZZLE & MATHEMATICS

  ...[

    ["P01","Easy","Complete: 2, 4, 6, 8, ?","श्रृंखला पूरी करें: 2, 4, 6, 8, ?","Series complete karo: 2, 4, 6, 8, ?",["9","10","11","12"],1],

    ["P02","Easy","What is 7 × 8?","7 × 8 कितना होता है?","7 × 8 kitna hota hai?",["54","56","58","64"],1],

    ["P03","Easy","If 5 apples cost ₹50, what is one apple's price?","5 सेबों की कीमत ₹50 है। एक सेब की कीमत कितनी है?","5 apples ₹50 ke hain. Ek apple ki price kitni hai?",["₹5","₹10","₹15","₹20"],1],

    ["P04","Hard","Complete: 3, 6, 12, 24, ?","श्रृंखला पूरी करें: 3, 6, 12, 24, ?","Series complete karo: 3, 6, 12, 24, ?",["36","42","48","54"],2],

    ["P05","Hard","What is 25% of 200?","200 का 25% कितना है?","200 ka 25% kitna hai?",["25","40","50","75"],2],

    ["P06","Hard","A number multiplied by 3 equals 27. What is the number?","किसी संख्या को 3 से गुणा करने पर 27 मिलता है। संख्या क्या है?","Kisi number ko 3 se multiply karne par 27 milta hai. Number kya hai?",["6","7","8","9"],3],

    ["P07","Very Hard","Complete: 1, 1, 2, 3, 5, 8, ?","श्रृंखला पूरी करें: 1, 1, 2, 3, 5, 8, ?","Series complete karo: 1, 1, 2, 3, 5, 8, ?",["11","12","13","15"],2],

    ["P08","Very Hard","If x + 15 = 42, what is x?","यदि x + 15 = 42 है, तो x कितना है?","Agar x + 15 = 42 hai, to x kitna hai?",["17","27","37","57"],1],

    ["P09","Very Hard","A rectangle is 12 cm long and 5 cm wide. What is its area?","एक आयत की लंबाई 12 सेमी और चौड़ाई 5 सेमी है। क्षेत्रफल कितना है?","Rectangle 12 cm long aur 5 cm wide hai. Area kitna hai?",["17 cm²","34 cm²","60 cm²","120 cm²"],2],

    ["P10","Extreme","A number is increased by 20% and becomes 180. What was the original number?","किसी संख्या में 20% वृद्धि करने पर 180 मिलता है। मूल संख्या क्या थी?","Number ko 20% increase karne par 180 milta hai. Original number kya tha?",["120","140","150","160"],2],

  ].map(([id,difficulty,en,hi,hinglish,options,answer]) => ({

    id, category:"Puzzle & Mathematics", difficulty,

    question:{en,hi,hinglish},

    options: {

  en: options,

  hi: options,

  hinglish: options,

},

    answer

  })),

];

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

function buildReview(session, answers) {

  const questions = Array.isArray(session?.selected_questions)

    ? session.selected_questions

    : [];

  const weights = {

    Easy: 3,

    Hard: 5,

    "Very Hard": 8,

    Extreme: 12,

  };

  return questions.map((question, index) => {

    const selected =

      Number.isInteger(answers?.[index])

        ? answers[index]

        : answers?.[String(index)] !== undefined

          ? Number(answers[String(index)])

          : null;

    const maxPoints = weights[question.difficulty] || 0;

    const correctAnswer = Number(question.answer);

    return {

      question: index + 1,

      questionId: question.id,

      category: question.category,

      selectedAnswer: selected,

      correctAnswer,

      correct: selected === correctAnswer,

      points: selected === correctAnswer ? maxPoints : 0,

      maxPoints,

      difficulty: question.difficulty,

    };

  });

}

function calculateResult(session, answers) {

  const review = buildReview(session, answers);

  const score = review.reduce(

    (sum, item) => sum + item.points,

    0

  );

  const correctCount = review.filter(

    (item) => item.correct

  ).length;

  const startedAt = new Date(session.started_at).getTime();

  const completedAt = Date.now();

  const elapsedMs = Math.max(

    0,

    completedAt - startedAt

  );

  return {

    score,

    correctCount,

    totalQuestions: review.length,

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

      callback_url: `${FRONTEND_URL}/?payment=success&sessionId=${encodeURIComponent(session.session_id)}`,

      callback_method: "get",

      notify: {

        email: false,

        sms: false,

        whatsapp: false,

      },

      reminder_enable: false,

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

      <p>You have completed all 15 questions of your IQNova educational challenge.</p>

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

  certificate_id,

  completedAt,

  completed_at,

}) {

  certificateId = certificateId || certificate_id;

  completedAt = completedAt || completed_at;

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

    const { sessionId, name, age, email, interests } = req.body;

    if (!sessionId || !name || !age || !email || !Array.isArray(interests)) {

      return res.status(400).json({

        success: false,

        message: "Name, age, email, sessionId and interests are required.",

      });

    }

// Exactly 5 interests required

    const selectedInterests = [...new Set(interests.map(String))];

    const selectedCategories = selectedInterests.map(

  (interest) => INTEREST_CATEGORY_MAP[interest]

);

if (selectedCategories.some((category) => !category)) {

  return res.status(400).json({

    success: false,

    message: "Invalid interest selected.",

  });

}

    if (selectedInterests.length !== 5) {

      return res.status(400).json({

        success: false,

        message: "Please select exactly 5 interests.",

      });

    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existing } = await supabase

      .from("challenge_sessions")

      .select("*")

      .eq("session_id", sessionId)

      .maybeSingle();

    if (existing) {

      return res.json({

        success: true,

        sessionId,

        interests: existing.interests || [],

        questions: existing.selected_questions || [],

      });

    }

// Select questions from the 5 chosen categories.

// 3 questions from each category = exactly 15 questions.

    const selectedQuestions = [];

    for (const category of selectedCategories) {

      const categoryQuestions = QUESTION_BANK.filter(

        (q) => q.category === category

      );

      const shuffled = [...categoryQuestions].sort(

        () => Math.random() - 0.5

      );

      selectedQuestions.push(...shuffled.slice(0, 3));

    }

// Shuffle the final 15-question order

    selectedQuestions.sort(() => Math.random() - 0.5);

    if (selectedQuestions.length !== QUESTION_COUNT) {

      return res.status(500).json({

        success: false,

        message: "Unable to generate challenge questions.",

      });

    }

// Never send correct answers to frontend

    const publicQuestions = selectedQuestions.map((q, index) => ({

      id: q.id,

      number: index + 1,

      category: q.category,

      difficulty: q.difficulty,

      question: q.question,

      options: q.options,

    }));

    const { error } = await supabase

      .from("challenge_sessions")

      .insert({

        session_id: sessionId,

        name: String(name).trim(),

        age: Number(age),

        email: normalizedEmail,

        interests: selectedInterests,

        selected_questions: selectedQuestions,

        started_at: new Date().toISOString(),

      });

    if (error) throw error;

    res.json({

      success: true,

      sessionId,

      interests: selectedInterests,

      questions: publicQuestions,

    });

  } catch (error) {

  console.error("Start error:", error);

  res.status(500).json({

    success: false,

    message: error?.message || "Challenge start failed.",

  });

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

// Already completed: result immediately return karo

    if (session.completed_at && session.result) {

      return res.json({

        success: true,

        completed: true,

        paid: Boolean(session.paid_at),

        result: {

          score: session.score,

          correctCount: session.correct_count,

          totalQuestions: QUESTION_COUNT,

          performance: session.performance,

          formattedTime: session.formatted_time,

        },

      });

    }

// Result calculate karo

    const result = calculateResult(session, answers);

// Result DB mein save karo

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

// IMPORTANT:

// Result ko payment/email se block mat karo.

// User ko immediately result page bhejo.

    res.json({

      success: true,

      completed: true,

      paid: false,

      result: {

        score: result.score,

        correctCount: result.correctCount,

        totalQuestions: QUESTION_COUNT,

        performance: result.performance,

        formattedTime: result.formattedTime,

      },

    });

// Payment link + email background mein handle honge.

// Inki failure se result page fail nahi hoga.

    (async () => {

      try {

        const completedSession = await getSession(sessionId);

        const paymentLink = await createOrGetPaymentLink(completedSession);

        await sendPaymentReminderEmail(completedSession, paymentLink);

      } catch (error) {

        console.error(

          "Background payment/email processing failed:",

          error?.message || error

        );

      }

    })();

  } catch (error) {

    console.error("Complete error:", error);

    if (!res.headersSent) {

      res.status(500).json({

        success: false,

        message: "Result calculation failed.",

      });

    }

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

        totalQuestions: QUESTION_COUNT,

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

        totalQuestions: QUESTION_COUNT,

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