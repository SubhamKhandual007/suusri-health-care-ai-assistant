import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './lib/AuthContext';
import ErrorBoundary from './lib/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';
import './App.css';

import Welcome from './components/Welcome';
import Main from './components/Main';

// Lazy load other components for better performance (code splitting)
const Chat = lazy(() => import('./components/Main/Chat'));
const Profile = lazy(() => import('./components/Profile/Profile'));
const VideoConsultation = lazy(() => import('./components/Main/VideoConsultation'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
    <LoadingSkeleton type="welcome" />
  </div>
);

const App = () => {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/main" element={<Main />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/video-consultation" element={<VideoConsultation />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
