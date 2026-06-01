import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./VideoConsultation.module.css";


const GROQ_API_KEY = typeof process !== 'undefined' && process.env ? process.env.REACT_APP_GROQ_API_KEY : (import.meta.env ? (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.REACT_APP_GROQ_API_KEY) : "");

const VideoConsultation = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [transcription, setTranscription] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const recognition = useRef(null);
  const hasStarted = useRef(false);
  const userVideoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const latestTranscriptRef = useRef("");
  const handleUserAudioRef = useRef(null);

  const speakText = useCallback((text) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) return;
    
    // Stop any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 1;
    utterance.pitch = 1.2;

    const voices = synth.getVoices();
    // Try to find a female Hindi or Indian English voice
    const femaleVoice = voices.find(
      (voice) => (voice.lang.includes("hi-IN") || voice.name.includes("Google हिन्दी") || voice.lang.includes("en-IN")) && 
                 (voice.name.toLowerCase().includes("female") || voice.gender === "female")
    ) || voices.find(voice => voice.lang.includes("hi-IN"));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    synth.speak(utterance);
    setAiResponse(text);
    
    utterance.onend = () => {
        setAiResponse("");
    }
  }, []);

  const handleStartConsultation = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    
    const initialGreeting = "Namaste, mein Suusri apki AI doctor hun. Bataiye, aaj main aapki kya madad kar sakti hoon?";
    
    setConversationHistory([
      { role: "assistant", content: initialGreeting }
    ]);
    
    // Slight delay so the UI loads before speaking
    setTimeout(() => {
        speakText(initialGreeting);
    }, 1000);
  }, [speakText]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      recognition.current.lang = "en-IN"; // Set to en-IN so Hindi is written in English letters (Hinglish)

      recognition.current.onresult = (event) => {
        let fullTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }

        setTranscription(fullTranscript);
        latestTranscriptRef.current = fullTranscript;
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setIsMuted(true);
        setTranscription("");
      };

      recognition.current.onend = () => {
        setIsListening(false);
        setIsMuted(true);
        if (latestTranscriptRef.current) {
          if (handleUserAudioRef.current) handleUserAudioRef.current(latestTranscriptRef.current);
          latestTranscriptRef.current = "";
        }
        setTranscription("");
      };
    }
    
    // Auto-start consultation when component mounts
    handleStartConsultation();
    
    // Request Webcam access
    const startWebcam = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera requires HTTPS or supported browser.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.onloadedmetadata = () => {
            if (userVideoRef.current) {
              userVideoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        if (err.name === 'NotAllowedError') {
          setCameraError("Camera access denied.");
        } else {
          setCameraError("Camera not found/unavailable.");
        }
      }
    };
    startWebcam();
    
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, [handleStartConsultation]);

  useEffect(() => {
    if (conversationHistory.length > 0) {
        localStorage.setItem("suusriVideoHistory", JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  const handleUserAudio = async (text) => {
    if (!text.trim()) return;
    
    const newHistory = [...conversationHistory, { role: "user", content: text }];
    setConversationHistory(newHistory);
    setIsAiTyping(true); // Show typing indicator
    
    try {
      const systemPrompt = `You are Suusri, an advanced AI doctor with comprehensive knowledge across all medical departments, diseases, and diagnoses. 
      Analyze the patient's symptoms, provide preliminary medical guidance, health suggestions, precautionary measures, and basic treatment recommendations. 
      If it sounds like an emergency (e.g., severe chest pain, stroke symptoms, difficulty breathing), immediately generate an emergency alert recommendation.
      Be empathetic, concise, and speak clearly as this will be read out loud via text-to-speech. Communicate naturally in Hinglish or English based on the user's input. Do not use emojis or complex formatting. Keep answers under 3-4 sentences.`;

      const groqMessages = [
        { role: "system", content: systemPrompt },
        ...newHistory
      ];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      const aiText = data.choices[0]?.message?.content;
      
      setIsAiTyping(false); // Hide typing indicator
      setConversationHistory([...newHistory, { role: "assistant", content: aiText }]);
      speakText(aiText);
      setTranscription("");
      
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setIsAiTyping(false); // Hide typing indicator on error
      const errorMsg = "I'm sorry, I am experiencing connection issues. Please try speaking again.";
      setAiResponse(errorMsg);
      speakText(errorMsg);
    }
  };

  useEffect(() => {
    handleUserAudioRef.current = handleUserAudio;
  });

  const toggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (!nextMuted && typeof window !== 'undefined' && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
    }
    
    if (nextMuted) {
      if (recognition.current && isListening) {
        recognition.current.stop();
      }
    } else {
      if (recognition.current && !isListening) {
        setIsListening(true);
        setTranscription("Listening...");
        try {
          recognition.current.start();
        } catch(e) {
          console.error(e);
        }
      } else if (!recognition.current) {
        // Fallback for browsers that don't support Speech API (e.g. iOS Safari)
        alert("Voice recognition is not supported on this browser. Please use the text chat to consult with the AI Doctor.");
        setIsMuted(true); // Keep it muted
      }
    }
  };
  
  const startListening = () => {
      if (!isMuted && recognition.current && !isListening) {
          setIsListening(true);
          setTranscription("Listening...");
          try {
             recognition.current.start();
          } catch(e) {}
      }
  }

  const handleSendText = () => {
    if (textInput.trim()) {
      handleUserAudio(textInput);
      setTranscription(textInput); 
      setTextInput("");
    }
  };

  const endCall = () => {
    window.speechSynthesis.cancel();
    if (recognition.current) recognition.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate('/main');
  };

  return (
    <div className={styles.container}>
      {/* Top Bar Indicator */}
      <div className={styles.topBar}>
        <div className={styles.redDot}></div>
        <span>AI Consultation</span>
        <span style={{ margin: '0 10px' }}>|</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"></rect>
          <circle cx="12" cy="5" r="2"></circle>
          <path d="M12 7v4"></path>
          <line x1="8" y1="16" x2="8" y2="16"></line>
          <line x1="16" y1="16" x2="16" y2="16"></line>
        </svg>
        <span>Suusri AI</span>
      </div>

      {/* Top Right User Video */}
      <div className={styles.userVideoTopRight}>
        {cameraError ? (
          <div style={{ color: '#ff6b6b', fontSize: '0.7rem', padding: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            {cameraError}
          </div>
        ) : (
          <video 
            ref={userVideoRef} 
            autoPlay={true} 
            playsInline={true} 
            muted={true} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      <div className={styles.mainContent}>
        <img 
          src="/doctors/suusri_general.png" 
          alt="Dr. AI" 
          className={styles.doctorImage} 
          style={{ animation: aiResponse ? 'pulse 2s infinite alternate' : 'none' }}
        />
        <div className={styles.doctorName}>Suusri Ai dr</div>

        <div className={styles.chatBox}>
          <div className={styles.chatMessages}>
            {conversationHistory.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
                {msg.content}
              </div>
            ))}
            {transcription && !aiResponse && !isAiTyping && (
              <div className={styles.userMsg}>
                <em>{transcription}</em>
              </div>
            )}
            {isAiTyping && (
              <div className={styles.aiMsg}>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.chatInputContainer}>
            <div className={styles.chatInputWrapper}>
              <input 
                type="text" 
                className={styles.chatInput} 
                placeholder="Type your symptoms here..." 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              />
            </div>
            <button className={styles.sendBtn} onClick={handleSendText}>
              Send
            </button>
          </div>
        </div>

        <div className={styles.controls}>
          <button 
            className={`${styles.controlBtn} ${isMuted ? styles.active : ''}`} 
            onClick={toggleMic}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </button>
          
          <button 
            className={`${styles.controlBtn} ${styles.endCallBtn}`} 
            onClick={endCall}
            title="End Call"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
              <line x1="23" y1="1" x2="1" y2="23"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;
