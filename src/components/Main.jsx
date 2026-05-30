import React from 'react';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Main.css';
import icon from '../Assets/img/suu2.png';
import icon1 from '../Assets/img/suu1.png';
import icon2 from '../Assets/img/suu3.png';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/AuthContext';

const Main = () => {
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();

  const handleChatNowClick = async () => {
    console.log("Chat button clicked, user:", user);
    if (user) {
      navigate('/chat');
    } else {
      try {
        console.log("Attempting Google login...");
        await loginWithGoogle();
        console.log("Login successful, navigating to chat");
        navigate('/chat');
      } catch (err) {
        console.error("Login Error:", err);
      }
    }
  };

  const handleVideoConsultClick = async () => {
    if (user) {
      navigate('/video-consultation');
    } else {
      try {
        await loginWithGoogle();
        navigate('/video-consultation');
      } catch (err) {
        console.error("Login Error:", err);
      }
    }
  };


  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <>
      <section className="main">
        {/* Animated Background Blobs */}
        <div className="blob-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        {/* First Section */}
        <section className="hero-section">
          <motion.div
            className="container custom-container"
            {...fadeInUp}
          >
            <div className="row align-items-center">
              <div className="col-md-6 order-2 order-md-1">
                <motion.img
                  src={icon}
                  alt="SuuSri AI Assistant"
                  className="img-fluid custom-image"
                  fetchPriority="high"
                  loading="eager"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="col-md-6 order-1 order-md-2 text-center">
                <h1 className="header">
                  <b>Meet</b> <span className="suuSriText">SuuSri</span>, <br />
                  <b>Your Smart Health Care AI Assistant</b>
                </h1>
                <p className="content-text">SuuSri stands for Smart Universal User Support & Resource Integration, providing intelligent healthcare guidance, symptom analysis, and wellness support.</p>
                <button className="button-69" role="button" onClick={handleChatNowClick}>
                  <span className="text">
                    <i className="fas fa-comments"></i>
                    <b>CHAT NOW</b>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Second Section */}
        <section className="hero-section">
          <motion.div
            className="container custom-container"
            {...fadeInUp}
          >
            <div className="row align-items-center">
              <div className="col-md-6 order-2 order-md-1 text-center">
                <h1 className="header">
                  <b>Your</b> <span className="suuSriText">Personalized</span> <br />
                  <b>Healthcare Intelligence</b>
                </h1>
                <p className="content-text">SuuSri is designed to provide proactive health tracking, analyze your symptoms, and enhance your medical awareness with precise, reliable, and empathetic AI responses.</p>
                <button className="button-69" role="button" onClick={handleVideoConsultClick} style={{ background: "linear-gradient(90deg, #6366f1, #a855f7)", color: "white", border: "none" }}>
                  <span className="text">
                    <i className="fas fa-video"></i>
                    <b style={{ marginLeft: "5px" }}>VIDEO CONSULT</b>
                  </span>
                </button>
              </div>
              <div className="col-md-6 order-1 order-md-2">
                <motion.img
                  src={icon1}
                  alt="SuuSri AI"
                  className="img-fluid custom-image"
                  loading="lazy"
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Third Section */}
        <section className="hero-section">
          <motion.div
            className="container custom-container"
            {...fadeInUp}
          >
            <div className="row align-items-center">
              <div className="col-md-6 order-2 order-md-1">
                <motion.img
                  src={icon2}
                  alt="Intelligent Assistant"
                  className="img-fluid custom-image"
                  loading="lazy"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="col-md-6 order-1 order-md-2 text-center">
                <h1 className="header">
                  <b>Discover</b> <span className="suuSriText">Wellness</span>, <br />
                  <b>Smart Diagnostics</b>
                </h1>
                <p className="content-text">With cutting-edge medical AI, SuuSri empowers you with accurate symptom analysis, smart health suggestions, and meaningful clinical insights.</p>
                <button className="button-69" role="button" onClick={handleChatNowClick}>
                  <span className="text">
                    <i className="fas fa-comments"></i>
                    <b>CHAT NOW</b>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Why Choose Section */}
        <div className="feature-section-wrapper">
          <motion.div
            className="container"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            <h2 className="header mb-5">Why Choose SuuSri?</h2>
            <div className="row">
              {[
                { title: "Instant Triage", desc: "Immediate symptom analysis powered by clinical AI algorithms." },
                { title: "Medical Context", desc: "Engaging, health-aware conversations that prioritize your well-being." },
                { title: "Personalized Care", desc: "Tailored wellness suggestions that understand your unique health profile." }
              ].map((feature, idx) => (
                <div className="col-md-4" key={idx}>
                  <motion.div
                    className="feature-box"
                    variants={fadeInUp}
                  >
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Main;
