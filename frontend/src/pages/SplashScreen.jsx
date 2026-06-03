import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const floatingHearts = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: Math.random() * 24 + 14,
  left: Math.random() * 100,
  delay: Math.random() * 3,
  duration: Math.random() * 3 + 4,
}));

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      if (user) {
        navigate(user.isProfileComplete ? '/discover' : '/setup-profile', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2800);
    return () => clearTimeout(timeout);
  }, [user, loading, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-dark)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Floating hearts */}
      {floatingHearts.map(h => (
        <motion.div
          key={h.id}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: -300 }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: `${h.left}%`,
            bottom: '10%',
            fontSize: h.size,
            pointerEvents: 'none',
          }}
        >
          💘
        </motion.div>
      ))}

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,63,94,0.25) 0%, transparent 70%)',
        top: '10%', left: '50%', transform: 'translateX(-50%)',
        filter: 'blur(40px)',
      }} />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        style={{ textAlign: 'center', zIndex: 1 }}
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1, 1.07, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 80, marginBottom: 16 }}
        >
          💘
        </motion.div>

        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fff 0%, #fecdd3 50%, #f9a8d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px',
          marginBottom: 8,
        }}>
          Romyntra
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.05rem',
            letterSpacing: '0.5px',
          }}
        >
          Find love. Plan the perfect date.
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ position: 'absolute', bottom: 60, display: 'flex', gap: 8 }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'rgba(244,63,94,0.8)',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
