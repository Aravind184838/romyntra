import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Film, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function RecommendationsPage() {
  const { matchId } = useParams();
  const navigate    = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState('restaurants');

  useEffect(() => {
    api.get(`/matches/${matchId}/recommendations`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Could not load recommendations'))
      .finally(() => setLoading(false));
  }, [matchId]);

  const tabs = [
    { id:'restaurants', label:'🍽️ Restaurants' },
    { id:'movies',      label:'🎬 Movies'      },
    { id:'datePlan',    label:'📅 Date Plan'   },
  ];

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gradient-dark)' }}>
      <div className="spinner" style={{ width:48, height:48, borderTopColor:'#f43f5e', borderColor:'rgba(255,255,255,0.2)' }}/>
    </div>
  );

  const recs = data?.recommendations || {};

  return (
    <div style={{ minHeight:'100vh', background:'var(--gradient-soft)', paddingBottom:40 }}>
      {/* Header */}
      <div style={{ background:'white', padding:'16px 20px', borderBottom:'1px solid var(--gray-100)',
        display:'flex', alignItems:'center', gap:12, boxShadow:'var(--shadow-sm)' }}>
        <button onClick={() => navigate(-1)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-600)', display:'flex' }}>
          <ArrowLeft size={22}/>
        </button>
        <div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'var(--gray-900)' }}>
            ✨ Date Recommendations
          </h1>
          {data?.compatibilityScore && (
            <p style={{ color:'var(--rose-500)', fontSize:'0.8rem', fontWeight:600 }}>
              {Math.round(data.compatibilityScore)}% compatibility match
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, background:'#fff', borderBottom:'2px solid var(--gray-100)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'14px 8px', border:'none', cursor:'pointer', fontSize:'0.82rem',
              fontWeight:600, fontFamily:'Outfit,sans-serif', background:'none',
              color: activeTab===t.id ? 'var(--rose-500)' : 'var(--gray-400)',
              borderBottom: activeTab===t.id ? '2px solid var(--rose-500)' : '2px solid transparent',
              transition:'all 0.2s', marginBottom:-2 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px', maxWidth:520, margin:'0 auto' }}>

        {/* Restaurants */}
        {activeTab==='restaurants' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {(recs.restaurants || []).length === 0
              ? <EmptyState icon="🍽️" msg="No restaurant recommendations yet"/>
              : (recs.restaurants || []).map((r, i) => (
                <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.07 }}
                  style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'var(--shadow-md)' }}>
                  <div style={{ background:'var(--gradient-primary)', padding:'20px 20px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.15rem', fontWeight:700,
                        color:'#fff', flex:1 }}>{r.name}</h3>
                      {r.rating && (
                        <span style={{ display:'flex', alignItems:'center', gap:4, color:'#fde68a',
                          fontWeight:700, fontSize:'0.9rem' }}>
                          <Star size={14} fill="#fde68a"/>  {r.rating}
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                      {r.cuisines && <Chip icon={<Sparkles size={12}/>} label={r.cuisines.join(', ')}/>}
                      {r.budgetMin && r.budgetMax && <Chip icon={<DollarSign size={12}/>} label={`₹${r.budgetMin} - ₹${r.budgetMax}`}/>}
                      {r.city && <Chip icon={<MapPin size={12}/>} label={r.city}/>}
                    </div>
                  </div>
                  <div style={{ padding:'12px 20px' }}>
                    {r.ambience && (
                      <p style={{ color:'var(--gray-500)', fontSize:'0.83rem', marginBottom:8 }}>
                        🏮 {r.ambience}
                      </p>
                    )}
                    {r.whyRecommended && (
                      <p style={{ color:'var(--gray-600)', fontSize:'0.85rem', lineHeight:1.6 }}>
                        💡 {r.whyRecommended}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            }
          </div>
        )}

        {/* Movies */}
        {activeTab==='movies' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {(recs.movies || []).length === 0
              ? <EmptyState icon="🎬" msg="No movie recommendations yet"/>
              : (recs.movies || []).map((m, i) => (
                <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.07 }}
                  style={{ background:'#fff', borderRadius:20, padding:'18px 20px', boxShadow:'var(--shadow-md)',
                    display:'flex', gap:14, alignItems:'center' }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#1f1035,#3b0f2f)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:24 }}>
                    🎬
                  </div>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'1rem',
                      color:'var(--gray-900)', marginBottom:4 }}>{m.title}</h3>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {m.genres && <span style={tagStyle}>{m.genres.join(', ')}</span>}
                      {m.rating && <span style={{...tagStyle,background:'var(--rose-50)',color:'var(--rose-600)'}}>
                        ⭐ {m.rating}</span>}
                      {m.mode && <span style={tagStyle}>{m.mode}</span>}
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </div>
        )}

        {/* Date Plan */}
        {activeTab==='datePlan' && (
          <div>
            {!(recs.datePlan?.timeline?.length)
              ? <EmptyState icon="📅" msg="No date plan generated yet"/>
              : (
                <>
                  {recs.datePlan.summary && (
                    <div style={{ background:'var(--gradient-primary)', borderRadius:18, padding:'16px 20px',
                      marginBottom:16, color:'#fff' }}>
                      <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, marginBottom:6 }}>
                        🗓️ Your Perfect Date
                      </h3>
                      <p style={{ opacity:0.85, fontSize:'0.9rem', lineHeight:1.6 }}>{recs.datePlan.summary}</p>
                    </div>
                  )}
                  {recs.datePlan.timeline.map((item, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*0.1 }}
                      style={{ display:'flex', gap:14, marginBottom:16 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--gradient-primary)',
                          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
                          fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>
                          {item.time || i+1}
                        </div>
                        {i < recs.datePlan.timeline.length-1 && (
                          <div style={{ width:2, flex:1, background:'var(--rose-100)', margin:'4px 0', minHeight:24 }}/>
                        )}
                      </div>
                      <div style={{ background:'#fff', borderRadius:16, padding:'14px 16px', flex:1,
                        boxShadow:'var(--shadow-sm)', marginBottom:4 }}>
                        <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)', marginBottom:4 }}>
                          {item.activity}
                        </p>
                        {item.description && (
                          <p style={{ color:'var(--gray-500)', fontSize:'0.83rem', lineHeight:1.5 }}>{item.description}</p>
                        )}
                        {item.duration && (
                          <p style={{ display:'flex', alignItems:'center', gap:4, color:'var(--rose-400)',
                            fontSize:'0.75rem', fontWeight:600, marginTop:6 }}>
                            <Clock size={12}/> {item.duration}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}

const tagStyle = {
  background:'var(--gray-100)', color:'var(--gray-600)', borderRadius:20,
  padding:'2px 10px', fontSize:'0.75rem', fontWeight:500,
};

function Chip({ icon, label }) {
  return (
    <span style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.2)',
      borderRadius:20, padding:'3px 10px', fontSize:'0.75rem', color:'#fff', fontWeight:500 }}>
      {icon}{label}
    </span>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--gray-400)' }}>
      <div style={{ fontSize:56, marginBottom:12 }}>{icon}</div>
      <p>{msg}</p>
    </div>
  );
}
