import React, { useState, useEffect } from "react";
import Main from "./Main";
import Navbar from './Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import './Welcome.css';

export default function Welcome() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPopup, setShowInstallPopup] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show popup after 3 seconds if on home screen
            setTimeout(() => {
                setShowInstallPopup(true);
            }, 3000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        window.addEventListener("appinstalled", () => {
            setShowInstallPopup(false);
            setDeferredPrompt(null);
            console.log("PWA installed");
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallPopup(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <Navbar />
            <Main />
            <Footer />

            <AnimatePresence>
                {showInstallPopup && deferredPrompt && (
                    <motion.div
                        className="install-popup"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        style={{
                            position: 'fixed',
                            bottom: '30px',
                            right: '30px',
                            zIndex: 1000,
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(15px)',
                            padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                            maxWidth: '320px',
                            color: 'white',
                            textAlign: 'center'
                        }}
                    >
                        <h4 style={{ margin: '0 0 10px 0', fontFamily: 'Lora, serif' }}>Install SuuSri AI</h4>
                        <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px' }}>
                            Add SuuSri to your home screen for a faster and better experience! 🚀
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowInstallPopup(false)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Not now
                            </button>
                            <button
                                onClick={handleInstallClick}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #FF69B4, #AF40FF)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 15px rgba(175, 64, 255, 0.3)'
                                }}
                            >
                                Install
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
