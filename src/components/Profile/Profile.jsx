import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirebase } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Listen to Firestore user doc in real-time
            try {
                const { db } = getFirebase();
                const userDocRef = doc(db, "users", parsedUser.uid);
                
                const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfileData({
                            credits: data.credits,
                            last_login: data.last_login?.toDate?.() ? data.last_login.toDate().toISOString() : data.last_login
                        });
                    } else {
                        setProfileData({ credits: 5 });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore onSnapshot error:", error);
                    setLoading(false);
                });
                
                return () => unsubscribe();
            } catch (err) {
                console.error("Firebase init error in Profile:", err);
                setLoading(false);
            }
        } else {
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const { auth } = getFirebase();
            await signOut(auth);
        } catch (err) {
            console.error("Logout error:", err);
        }
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h2>Profile Folder</h2>
                </div>
                
                <div className="profile-content">
                    <div className="profile-image-container">
<img 
  src={user.picture || '/suu-icon.png'} 
  alt={user.name} 
  className="profile-pic-large" 
  onError={(e) => {
    e.target.src = '/suu-icon.png';
    e.target.alt = 'SuuSri Avatar';
  }}
/>
                    </div>
                    
                    <div className="profile-info">
                        <div className="info-group">
                            <label>Name</label>
                            <p>{user.name}</p>
                        </div>
                        <div className="info-group">
                            <label>Email</label>
                            <p>{user.email}</p>
                        </div>
                        <div className="info-group">
                            <label>Talks Remaining</label>
                            <p className="credits-text">
                                Unlimited ∞
                            </p>
                        </div>
                        <div className="info-group">
                            <label>Member Since</label>
                            <p>{new Date(user.last_login).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <div className="profile-footer">
                <p>Protected by SuuSri Backend SSO</p>
            </div>
        </div>
    );
};

export default Profile;
