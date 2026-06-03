import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const confettiColors = ['#f43f5e','#ec4899','#a855f7','#fb923c','#facc15','#4ade80'];
const confetti = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  color: confettiColors[i % confettiColors.length],
  left: Math.random() * 100,
  delay: Math.random() * 0.6,
  duration: Math.random() * 1.5 + 1.5,
  size: Math.random() * 8 + 5,
}));

export default function MatchPopup({ match, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!match) return null;
  const { user1, user2, matchId } = match;

  const avatar = (u) => u?.photos?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name||'?')}&background=f43f5e&color=fff&size=200`;

  return (
    <AnimatePresence>
      <motion.div className="match-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}>
        {/* Confetti */}
        {confetti.map(c => (
          <motion.div key={c.id}
            initial={{ y: -20, x: `${c.left}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: '110vh', opacity: 0, rotate: 720 }}
            transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
            style={{ position:'fixed', top:0, width:c.size, height:c.size, borderRadius:2,
              background:c.color, pointerEvents:'none', zIndex:300 }}/>
        ))}

        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          onClick={e => e.stopPropagation()}
          style={{ textAlign:'center', maxWidth:360, width:'100%', padding:'0 20px', zIndex:301 }}
        >
          {/* Avatars */}
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', marginBottom:24, gap:0 }}>
            <motion.img src={avatar(user1)} alt=""
              initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type:'spring', stiffness:200 }}
              style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover',
                border:'4px solid #fff', boxShadow:'0 8px 32px rgba(244,63,94,0.5)', zIndex:2, position:'relative' }}/>
            <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1.5 }}
              style={{ zIndex:3, fontSize:32, margin:'0 -8px', filter:'drop-shadow(0 0 12px rgba(244,63,94,0.8))' }}>💘</motion.div>
            <motion.img src={avatar(user2)} alt=""
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type:'spring', stiffness:200 }}
              style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover',
                border:'4px solid #fff', boxShadow:'0 8px 32px rgba(168,85,247,0.5)', zIndex:2, position:'relative' }}/>
          </div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
            <p style={{ color:'rgba(255,255,255,0.6)', fontFamily:'Outfit,sans-serif', fontSize:'0.9rem',
              letterSpacing:4, fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>It's a Match!</p>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'2.2rem', fontWeight:900, color:'#fff',
              background:'linear-gradient(135deg,#fff,#fecdd3)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              marginBottom:8 }}>
              You &amp; {user2?.name?.split(' ')[0]}
            </h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem', marginBottom:28 }}>
              Start a conversation and plan your perfect date ✨
            </p>
          </motion.div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <button id="match-chat" onClick={()=>{ onClose(); navigate(`/chat/${matchId}`); }}
              className="btn btn-primary btn-lg">
              <MessageCircle size={20}/> Send a Message
            </button>
            <button id="match-keep-swiping" onClick={onClose}
              style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)',
                borderRadius:999, padding:'14px 32px', fontFamily:'Outfit,sans-serif', fontWeight:600,
                cursor:'pointer', backdropFilter:'blur(8px)', fontSize:'0.95rem' }}>
              <Heart size={18}/> Keep Swiping
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
