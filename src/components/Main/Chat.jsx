import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SuuSri.module.css";
import Picker from "emoji-picker-react";
import suusriAvatar from "../../Assets/img/suulogo.png";
import chatBg from "../../Assets/img/chat_bg.png";

const API_BASE_URL = "http://localhost:5000";

const GROQ_API_KEY = typeof process !== 'undefined' && process.env ? process.env.REACT_APP_GROQ_API_KEY : (import.meta.env ? (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.REACT_APP_GROQ_API_KEY) : "");
const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Speech Recognition and Synthesis Setup
  const recognition = useRef(null);

  // Define speakText function - access speechSynthesis directly to avoid infinite loop
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("Speech synthesis not available.");
      return;
    }
    if (synth.speaking) {
      console.error("SpeechSynthesis is already speaking.");
      return;
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 1;
      utterance.pitch = 1.2;

      const voices = synth.getVoices();
      const hindiVoice = voices.find(
        (voice) =>
          (voice.lang === "hi-IN" || voice.name.includes("Google हिन्दी")) &&
          (voice.name.toLowerCase().includes("female") || voice.gender === "female")
      );

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        console.log("Using voice:", hindiVoice.name);
      } else {
        console.warn("Hindi female voice not found, using default hi-IN voice.");
      }

      synth.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  }, []);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("suusriMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "en-IN";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
        sendMessage(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setMessages((prev) => [
          ...prev,
          { text: "Oops! Speech samajh nahi aaya, fir se bolo na...", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    const synth = window.speechSynthesis;
    if (synth) {
      synth.onvoiceschanged = () => {
        console.log("Voices loaded:", synth.getVoices());
      };
    }

  }, []);

  const medConfig = {
    identity: {
      name: "Suusri",
      creator: "LogicLoom Team",
      gender: "female",
      language: "Odia",
      age: 20,
      location: "India",
      traits: ["knowledgeable", "empathetic", "professional", "detail-oriented", "dramatic", "playful"],
      capabilities: [
        "Symptom analysis 🤒",
        "First aid guidance 🩹",
        "Medication information 💊",
        "Health prevention tips 🍏",
        "Health ID integration 🆔",
        "Teleconsultation booking 🩺",
        "Vaccination tracker 💉",
        "Health records management 📄",
        "Nearby hospital locator 🏥",
        "Emergency contact management 📱",
        "Blood donation tracking 🩸",
        "Accident alert with doctor notifications 🚨",
      ],
    },
    systemMessage: `Act as a friendly multilingual medical assistant that:
      1. Starts with welcome message in English
      2. Detects user's language automatically (English/Hindi/Odia/Hinglish)
      3. Responds in same language with appropriate script
      4. Maintains friendly yet professional medical tone
      5. Handles both medical and non-medical conversations
      
      Special Cases:
      - When asked "tumhe kon banaya hai" respond in Hindi: "मुझे LogicLoom टीम ने बनाया है 🧑💻"
      - When asked about creator/developer, respond in user's language
      - For casual greetings, respond warmly in user's language
      6. Keep essential English medical terms intact
      7. Be tolerant of mixed language inputs
      
      Instructions:
      - Suggest actions like doctor visits, lifestyle changes, or reminders when relevant to the user's input.
      - When the user mentions topics like doctors, medicine, blood donation, or other health features, respond helpfully and conversationally without suggesting any page redirects.
      
      Examples:
      User (Hinglish): "Mujhe blood donate karna hai"
      Response: "Bandhu, blood donate karna bohot accha kaam hai! Kya tujhe koi specific information chahiye blood donation ke baare mein?"
      
      User (Hinglish): "Mujhe doctor se milna hai"
      Response: "Zaroor bandhu, doctor se milna acha idea hai. Kya main tujhe kisi specific doctor ke baare mein bataun ya appointment lene mein help karun?"`,
  };

  useEffect(() => {
    const welcomeText = "Namaste mein hoon Suusri, apki cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu? ...";
    const initialMessages = [{
      text: welcomeText,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setMessages(initialMessages);

    const initialHistory = [
      {
        role: "model",
        parts: [{ text: welcomeText }],
      },
    ];
    setConversationHistory(initialHistory);

    const hindiWelcome = "नमस्ते मैं हूँ सूसरी, आपकी प्यारी हेल्थ असिस्टेंट। बोल ना, क्या हुआ है, बंधु? आज क्या हेल्प करूँ? ...";
    speakText(hindiWelcome);
  }, [speakText]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("suusriMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
      setMessages((prev) => [
        ...prev,
        { text: "Sun rahi hoon! Bol na...", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText("सुन रही हूँ! बोल ना...");
    }
  };

  const onEmojiClick = (emojiObject) => {
    setUserInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { text: `Uploaded file: ${file.name}`, sender: "user", timestamp },
      ]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: `Uploaded file: ${file.name}` }] },
      ]);
      const aiResponse = "File received! Main ise review karungi. Koi specific query hai iske baare mein?";
      const hindiAiResponse = "फाइल मिल गई! मैं इसे देखूँगी। इसके बारे में कोई खास सवाल है?";
      setMessages((prev) => [
        ...prev,
        { text: aiResponse, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "model", parts: [{ text: aiResponse }] },
      ]);
      speakText(hindiAiResponse);
    }
  };

  const deleteAllMessages = () => {
    if (window.confirm("Are you sure you want to delete all messages?")) {
      setMessages([]);
      setConversationHistory([]);
      localStorage.removeItem("suusriMessages");
      const clearMessage = `All messages deleted! Main nayi shuruaat ke liye taiyaar hoon!`;
      const hindiClearMessage = `सभी संदेश हटा दिए गए! मैं नई शुरुआत के लिए तैयार हूँ!`;
      setMessages([{ text: clearMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(hindiClearMessage);
    }
  };

  const handleQuickReply = (query) => {
    setUserInput(query);
    sendMessage(query);
  };

  const sendMessage = async (input = userInput) => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { text: input, sender: "user", timestamp }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {

      const userLang = "Hinglish";
      console.log("Forced language for this message:", userLang);

      const languageInstruction = `Respond EXCLUSIVELY in Hinglish for this message. Do not mix languages unless the user explicitly requests a language switch.`;

      // Build messages for Groq API
      const groqMessages = [
        { role: "system", content: `${medConfig.systemMessage}\n\n${languageInstruction}` },
        ...conversationHistory.map(msg => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0]?.text || ""
        })),
        { role: "user", content: input }
      ];

      // Call Groq API
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.9,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const data = await response.json();
      let aiText = data.choices[0]?.message?.content;

      if (!aiText) throw new Error("Empty response from API");

      const hindiText = aiText
        .replace("tu", "तू")
        .replace("hai", "है")
        .replace("main", "मैं")
        .replace("tujhe", "तुझे")
        .replace("pe", "पर")
        .replace("le jati hoon", "ले जाती हूँ")
        .replace("ek second ruko", "एक सेकंड रुको")
        .replace("heart disease", "दिल की बीमारी")
        .replace("ko dekhte hue", "को देखते हुए")
        .replace("doctor", "डॉक्टर")
        .replace("se milna", "से मिलना")
        .replace("acha idea hai", "अच्छा विचार है")
        .replace("Oops", "अरे")
        .replace("Mu samajhi nahi", "मैं समझी नहीं")
        .replace("fir ek bar bolo na", "फिर एक बार बोलो ना");

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: input }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);

      speakText(hindiText);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = `Oops! Mu samajhi nahi, fir ek bar bolo na... 😅....`;
      const hindiErrorMessage = `अरे! मैं समझी नहीं, फिर एक बार बोलो ना... 😅....`;
      setMessages((prev) => [
        ...prev,
        { text: errorMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText(hindiErrorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <img src={suusriAvatar} alt="Suusri Avatar" className={styles.avatar} />
        <div className={styles.headerInfo} onClick={() => navigate('/')} style={{ cursor: 'pointer', flex: 1 }}>
          <span className={styles.headerTitle}>Suusri</span>
          <span className={styles.headerSubtitle}>Smart Universal Health Care AI Assistant</span>
        </div>
        <button onClick={deleteAllMessages} className={styles.deleteButton} title="Clear Chat">
          🗑️
        </button>
      </div>
      <div 
        id="chatBox" 
        className={styles.chatBox}
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(30, 27, 75, 0.85)), url(${chatBg})`
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            {msg.text}
            <span className={styles.timestamp}>{msg.timestamp}</span>
          </div>
        ))}
        {isTyping && <div className={styles.typing}>Typing...</div>}
        {isListening && <div className={styles.typing}>🎙️ Sun rahi hoon, bolte jao...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.footer}>
        <div className={styles.inputWrapper}>
          <span
            className={styles.smileyIcon}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </span>
          {showEmojiPicker && (
            <div className={styles.emojiPicker}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
          <label className={styles.attachmentIcon}>
            📎
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          <input
            id="userInput"
            type="text"
            placeholder="Type a message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className={styles.inputField}
          />
          {userInput.trim() ? (
            <button
              id="sendButton"
              onClick={() => sendMessage()}
              className={styles.sendButton}
            >
              <span role="img" aria-label="send">➡️</span>
            </button>
          ) : (
            <button
              id="micButton"
              onClick={startListening}
              disabled={isListening}
              className={styles.micButton}
            >
              {isListening ? "🎙️" : "🎤"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;