import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnimatedBackground from './components/AnimatedBackground';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastContext';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Summarize from './pages/Summarize';
import ApiAdmin from './pages/ApiAdmin';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' }
};

const AppShell = () => {
  const location = useLocation();

  // Custom cursor
  const [cursor, setCursor] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const move = (e) => {
      setCursor({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg text-text">
        <AnimatedBackground />
        <Navbar />

        {/* Custom cursor */}
        <div
          className="pointer-events-none fixed z-50 h-2 w-2 rounded-full bg-primary shadow-[0_0_20px_rgba(108,71,255,0.9)] transition-transform duration-75"
          style={{
            transform: `translate3d(${cursor.x - 4}px, ${cursor.y - 4}px, 0)`
          }}
        />

        <main className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <motion.div {...pageTransition}>
                    <Landing />
                  </motion.div>
                }
              />
              <Route
                path="/signin"
                element={
                  <motion.div {...pageTransition}>
                    <SignIn />
                  </motion.div>
                }
              />
              <Route
                path="/signup"
                element={
                  <motion.div {...pageTransition}>
                    <SignUp />
                  </motion.div>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition}>
                      <Dashboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition}>
                      <Profile />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition}>
                      <Settings />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/summarize"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition}>
                      <Summarize />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-admin"
                element={
                  <motion.div {...pageTransition}>
                    <ApiAdmin />
                  </motion.div>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </ToastProvider>
  );
};

const App = () => <AppShell />;

export default App;

