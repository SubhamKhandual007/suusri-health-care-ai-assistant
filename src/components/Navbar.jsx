import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Main.css';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, loginWithGoogle, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProfileClick = async () => {
        if (user) {
            setShowDropdown(!showDropdown);
        } else {
            try {
                const result = await loginWithGoogle();
                console.log("Login successful:", result);
            } catch (err) {
                console.error("Login Error:", err);
            }
        }
    };

    const handleLogout = async () => {
        setShowDropdown(false);
        await logout();
    };

    const handleGoToProfile = () => {
        setShowDropdown(false);
        navigate('/profile');
    };

    return (
        <>
            <nav className={`navbar navbar-expand-lg sticky-top ${scrolled ? 'scrolled' : ''}`}>
                <div className="container d-flex justify-content-between align-items-center">
                    <a className="navbar-brand" href="/"><b>SuuSri</b></a>
                    
                    <div className="nav-profile-wrapper" ref={dropdownRef}>
                        <div className="nav-profile" onClick={handleProfileClick}>
                            {user && user.picture ? (
                                <img 
                                  src={user.picture} 
                                  alt="Profile" 
                                  className="profile-pic-nav" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div class="profile-dummy-icon"><i class="fas fa-user-circle"></i></div>';
                                  }}
                                />
                            ) : (
                                <div className="profile-dummy-icon">
                                    <i className="fas fa-user-circle"></i>
                                </div>
                            )}
                        </div>

                        {/* Dropdown menu for logged-in users */}
                        {showDropdown && user && (
                            <div className="nav-profile-dropdown">
                                <div className="dropdown-user-info">
                                    <span className="dropdown-user-name">{user.name}</span>
                                    <span className="dropdown-user-email">{user.email}</span>
                                </div>
                                <hr className="dropdown-divider" />
                                <button className="dropdown-item" onClick={handleGoToProfile}>
                                    <i className="fas fa-user"></i> Profile
                                </button>
                                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
