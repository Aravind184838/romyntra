import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Zap, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import SwipeCard from '../components/SwipeCard';
import MatchPopup from '../components/MatchPopup';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [match, setMatch]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/discover');
        setProfiles(data.users || []);
      } catch (err) {
        toast.error('Could not load profiles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSwipe = useCallback(async (action) => {
    if (swiping) return;
    const profile = profiles[currentIdx];
    if (!profile) return;
    setSwiping(true);
    try {
      const { data } = await api.post(`/swipe/${action}`, { targetId: profile._id });
      if (data.match) {
        setMatch({ matchId: data.match._id, user1: user, user2: profile });
      }
      setCurrentIdx(i => i + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTimeout(() => setSwiping(false), 400);
    }
  }, [profiles, currentIdx, swiping, user]);

  const visibleProfiles = profiles.slice(currentIdx, currentIdx + 3);
  const done = !loading && currentIdx >= profiles.length;

  return (
    <div className="page" style={{ background:'var(--gray-50)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.6rem', fontWeight:800,
            background:'var(--gradient-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Romyntra
          </h1>
          <p style={{ color:'var(--gray-400)', fontSize:'0.8rem', marginTop:1 }}>
            {loading ? 'Loading...' : done ? 'All caught up!' : `${profiles.length - currentIdx} profiles near you`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>toast('Filters coming soon!')}
            style={{ background:'#fff', border:'1px solid var(--gray-200)', borderRadius:12,
              width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'var(--shadow-sm)' }}>
            <Zap size={18} color="var(--rose-500)"/>
          </button>
        </div>
      </div>

      {/* Card stack */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 24px 0' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center', paddingTop:80 }}>
            <div className="spinner" style={{ width:48, height:48, borderTopColor:'var(--rose-500)' }}/>
            <p style={{ color:'var(--gray-400)' }}>Finding matches near you...</p>
          </div>
        ) : done ? (
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
            style={{ textAlign:'center', paddingTop:60 }}>
            <div style={{ fontSize:72, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:700,
              color:'var(--gray-800)', marginBottom:8 }}>You've seen everyone!</h2>
            <p style={{ color:'var(--gray-500)', marginBottom:24 }}>Check back later for new profiles</p>
            <button onClick={()=>{ setCurrentIdx(0); setProfiles([]); }}
              className="btn btn-primary">
              <RotateCcw size={16}/> Start Over
            </button>
          </motion.div>
        ) : (
          <div className="swipe-stack">
            <AnimatePresence>
              {[...visibleProfiles].reverse().map((profile, reverseIdx) => {
                const stackIdx = visibleProfiles.length - 1 - reverseIdx;
                const isTop = stackIdx === 0;
                return (
                  <SwipeCard
                    key={profile._id}
                    profile={profile}
                    isTop={isTop}
                    onSwipe={handleSwipe}
                    style={{
                      scale: 1 - stackIdx * 0.04,
                      y: stackIdx * 12,
                      zIndex: visibleProfiles.length - stackIdx,
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!loading && !done && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:16,
          padding:'16px 24px 24px' }}>
          <button id="btn-pass" className="btn-icon pass lg"
            onClick={() => handleSwipe('pass')} disabled={swiping}>
            <X size={26}/>
          </button>
          <button id="btn-superlike" className="btn-icon super"
            onClick={() => handleSwipe('superlike')} disabled={swiping}>
            <Star size={22}/>
          </button>
          <button id="btn-like" className="btn-icon like xl"
            onClick={() => handleSwipe('like')} disabled={swiping}>
            <Heart size={30} fill="white"/>
          </button>
        </div>
      )}

      <Navbar/>

      {/* Match popup */}
      <AnimatePresence>
        {match && <MatchPopup match={match} onClose={() => setMatch(null)}/>}
      </AnimatePresence>
    </div>
  );
}
