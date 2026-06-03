import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function MatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/matches');
        setMatches(data.matches || []);
      } catch { toast.error('Could not load matches'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const avatar = (u) =>
    u?.photos?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name||'?')}&background=f43f5e&color=fff&size=200`;

  return (
    <div className="page" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background:'#fff', padding:'20px 24px 16px', borderBottom:'1px solid var(--gray-100)',
        boxShadow:'var(--shadow-sm)' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'var(--gray-900)' }}>
          💘 Your Matches
        </h1>
        <p style={{ color:'var(--gray-400)', fontSize:'0.85rem', marginTop:2 }}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
        </p>
      </div>

      <div style={{ padding:'16px', maxWidth:500, margin:'0 auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div className="spinner" style={{ borderTopColor:'var(--rose-500)' }}/>
          </div>
        ) : matches.length === 0 ? (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            style={{ textAlign:'center', padding:'60px 24px' }}>
            <div style={{ fontSize:72, marginBottom:16 }}>💫</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:700,
              color:'var(--gray-800)', marginBottom:8 }}>No matches yet</h2>
            <p style={{ color:'var(--gray-500)', marginBottom:24 }}>Keep swiping to find your match!</p>
            <button onClick={() => navigate('/discover')} className="btn btn-primary">
              <Heart size={18}/> Start Swiping
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {matches.map((m, i) => {
                const other = m.users?.find(u => u._id !== user?._id);
                return (
                  <motion.div key={m._id}
                    initial={{ opacity:0, scale:0.9, y:20 }}
                    animate={{ opacity:1, scale:1, y:0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ background:'#fff', borderRadius:20, overflow:'hidden',
                      boxShadow:'var(--shadow-md)', cursor:'pointer', position:'relative' }}
                  >
                    <div style={{ aspectRatio:'3/4', overflow:'hidden' }}>
                      <img src={avatar(other)} alt={other?.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover',
                          transition:'transform 0.3s' }}
                        onMouseEnter={e=>e.target.style.transform='scale(1.05)'}
                        onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
                    </div>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0,
                      background:'linear-gradient(transparent,rgba(0,0,0,0.85))', padding:'32px 12px 12px' }}>
                      <p style={{ color:'#fff', fontFamily:'Outfit,sans-serif', fontWeight:700,
                        fontSize:'1rem', marginBottom:2 }}>
                        {other?.name?.split(' ')[0] || 'User'}
                      </p>
                      {m.matchScore && (
                        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.72rem' }}>
                          {Math.round(m.matchScore)}% match
                        </p>
                      )}
                      <div style={{ display:'flex', gap:6, marginTop:8 }}>
                        <button id={`match-chat-${m._id}`}
                          onClick={() => navigate(`/chat/${m._id}`)}
                          style={{ flex:1, background:'var(--gradient-primary)', border:'none', borderRadius:8,
                            color:'#fff', padding:'6px 0', fontSize:'0.75rem', fontWeight:600, cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                          <MessageCircle size={13}/> Chat
                        </button>
                        <button id={`match-recs-${m._id}`}
                          onClick={() => navigate(`/recommendations/${m._id}`)}
                          style={{ flex:1, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)',
                            borderRadius:8, color:'#fff', padding:'6px 0', fontSize:'0.75rem', fontWeight:600,
                            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                            backdropFilter:'blur(8px)' }}>
                          <Sparkles size={13}/> Dates
                        </button>
                      </div>
                      {m.recommendations?.restaurants?.length > 0 && (
                        <div style={{ marginTop:6, fontSize:'0.65rem', color:'rgba(255,255,255,0.6)', lineHeight:1.4 }}>
                          🍽️ {m.recommendations.restaurants[0]?.name}
                          {m.recommendations.movies?.length > 0 && <> · 🎬 {m.recommendations.movies[0]?.title}</>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
      <Navbar matchCount={matches.length}/>
    </div>
  );
}
