import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Zap, RotateCcw, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import SwipeCard from '../components/SwipeCard';
import MatchPopup from '../components/MatchPopup';

const INTERESTS = ['Hiking','Photography','Cooking','Travel','Music','Art','Reading','Gaming',
  'Yoga','Dancing','Fitness','Movies','Coffee','Wine','Pets','Foodie','Tech','Fashion'];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [match, setMatch]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minAge:'', maxAge:'', interests:[], location:'' });

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.minAge) params.set('minAge', filters.minAge);
    if (filters.maxAge) params.set('maxAge', filters.maxAge);
    if (filters.interests.length) params.set('interests', filters.interests.join(','));
    if (filters.location) params.set('location', filters.location);
    return params.toString();
  };

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const { data } = await api.get(`/users/discover${qs ? `?${qs}` : ''}`);
      setProfiles(data.users || []);
    } catch (err) {
      toast.error('Could not load profiles');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const toggleInterest = (it) => setFilters(p => ({
    ...p,
    interests: p.interests.includes(it) ? p.interests.filter(x=>x!==it) : [...p.interests, it],
  }));

  const resetFilters = () => {
    setFilters({ minAge:'', maxAge:'', interests:[], location:'' });
    setCurrentIdx(0);
  };

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
          <button onClick={()=>setShowFilters(p=>!p)}
            style={{ background: showFilters ? 'var(--rose-100)' : '#fff', border:'1px solid var(--gray-200)', borderRadius:12,
              width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'var(--shadow-sm)' }}>
            <SlidersHorizontal size={18} color="var(--rose-500)"/>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
            style={{ overflow:'hidden', margin:'0 24px' }}>
            <div style={{ background:'#fff', borderRadius:16, padding:16, boxShadow:'var(--shadow-md)', marginBottom:12 }}>
              <p style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--gray-700)', marginBottom:10 }}>Age Range</p>
              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                <input type="number" placeholder="Min" min={18} max={99}
                  value={filters.minAge} onChange={e=>setFilters(p=>({...p,minAge:e.target.value}))}
                  style={{ flex:1, padding:'8px 10px', borderRadius:10, border:'2px solid var(--gray-200)',
                    fontSize:'0.85rem', outline:'none', width:'100%', boxSizing:'border-box' }}/>
                <input type="number" placeholder="Max" min={18} max={99}
                  value={filters.maxAge} onChange={e=>setFilters(p=>({...p,maxAge:e.target.value}))}
                  style={{ flex:1, padding:'8px 10px', borderRadius:10, border:'2px solid var(--gray-200)',
                    fontSize:'0.85rem', outline:'none', width:'100%', boxSizing:'border-box' }}/>
              </div>
              <p style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--gray-700)', marginBottom:10 }}>Location</p>
              <input type="text" placeholder="City name..."
                value={filters.location} onChange={e=>setFilters(p=>({...p,location:e.target.value}))}
                style={{ width:'100%', padding:'8px 10px', borderRadius:10, border:'2px solid var(--gray-200)',
                  fontSize:'0.85rem', outline:'none', marginBottom:14, boxSizing:'border-box' }}/>
              <p style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--gray-700)', marginBottom:10 }}>Interests</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                {INTERESTS.map(it => (
                  <button key={it} onClick={()=>toggleInterest(it)}
                    style={{ padding:'5px 12px', borderRadius:999, fontSize:'0.75rem', fontWeight:500, cursor:'pointer',
                      border:'none', background: filters.interests.includes(it) ? 'var(--gradient-primary)' : 'var(--gray-100)',
                      color: filters.interests.includes(it) ? '#fff' : 'var(--gray-600)' }}>
                    {it}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>{ resetFilters(); setShowFilters(false); }}
                  style={{ flex:1, padding:'10px', borderRadius:12, border:'2px solid var(--gray-200)',
                    background:'#fff', fontWeight:600, color:'var(--gray-600)', cursor:'pointer', fontSize:'0.85rem' }}>
                  Reset
                </button>
                <button onClick={()=>{ setCurrentIdx(0); setShowFilters(false); }}
                  className="btn btn-primary" style={{ flex:1, fontSize:'0.85rem' }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <button onClick={()=>{ setCurrentIdx(0); loadProfiles(); }}
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
