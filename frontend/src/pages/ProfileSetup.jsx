import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const INTERESTS = ['Hiking','Photography','Cooking','Travel','Music','Art','Reading','Gaming',
  'Yoga','Dancing','Fitness','Movies','Coffee','Wine','Pets','Foodie','Tech','Fashion'];
const CUISINES  = ['Italian','Indian','Japanese','Mexican','Chinese','Thai','Mediterranean','American','Korean','French'];
const GENRES    = ['Romance','Comedy','Action','Drama','Thriller','Sci-Fi','Horror','Documentary','Animation'];
const AMBIENCE  = ['Rooftop','Cozy Cafe','Fine Dining','Outdoor','Beachside','Casual','Lounge','Garden'];
const GENDERS   = ['Man','Woman','Non-binary','Other'];
const LOOKING   = ['Women','Men','Everyone'];
const STEPS     = ['Photos','About You','Interests','Date Prefs'];

export default function ProfileSetup() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    bio:'', gender:'', lookingFor:'', interests:[],
    cuisinePreferences:[], movieGenres:[], ambiencePreferences:[], budgetRange:{ min:500, max:3000 },
  });

  const toggle = (field, val) => setForm(p => {
    const arr = p[field];
    return { ...p, [field]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val] };
  });

  const addPhoto = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(p => p.length < 6 ? [...p, { url:ev.target.result, file:f }] : p);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i) => setPhotos(p => p.filter((_,idx)=>idx!==i));

  const handleFinish = async () => {
    if (!form.gender) { toast.error('Please select your gender'); return; }
    if (!form.lookingFor) { toast.error('Please select who you are interested in'); return; }
    if (!form.bio.trim()) { toast.error('Add a short bio'); return; }
    if (form.interests.length === 0) { toast.error('Pick at least one interest'); return; }
    if (photos.length === 0) { toast.error('Add at least one photo'); setStep(0); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('bio', form.bio);
      fd.append('gender', form.gender);
      fd.append('lookingFor', form.lookingFor);
      fd.append('interests', JSON.stringify(form.interests));
      fd.append('cuisinePreferences', JSON.stringify(form.cuisinePreferences));
      fd.append('movieGenres', JSON.stringify(form.movieGenres));
      fd.append('ambiencePreferences', JSON.stringify(form.ambiencePreferences));
      fd.append('budgetRange', JSON.stringify(form.budgetRange));
      photos.forEach(p => p.file && fd.append('photos', p.file));
      const { data } = await api.put('/users/profile', fd);
      if (data.user) updateUser(data.user);
      toast.success('Profile ready! 💘');
      navigate('/discover', { replace:true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  const chipStyle = (active) => ({
    display:'inline-flex', alignItems:'center', gap:4, padding:'7px 14px',
    borderRadius:999, fontSize:'0.82rem', fontWeight:500, cursor:'pointer',
    border: active ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
    background: active ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    transition:'all 0.2s',
    boxShadow: active ? '0 2px 12px rgba(244,63,94,0.35)' : 'none',
  });

  return (
    <div className="page-auth" style={{ overflowY:'auto', justifyContent:'flex-start', padding:'32px 20px 60px' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-10%', right:'-10%', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(244,63,94,0.15) 0%,transparent 70%)', filter:'blur(60px)' }}/>
      </div>

      <div style={{ width:'100%', maxWidth:440, margin:'0 auto', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.7rem', fontWeight:800, color:'#fff', marginBottom:4 }}>
            Set Up Your Profile
          </h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem' }}>Step {step+1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div style={{ display:'flex', gap:6, marginBottom:28 }}>
          {STEPS.map((_,i) => (
            <div key={i} style={{ flex:1, height:4, borderRadius:2,
              background: i<=step ? 'linear-gradient(90deg,#f43f5e,#a855f7)' : 'rgba(255,255,255,0.2)',
              transition:'all 0.4s' }}/>
          ))}
        </div>

        <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:24, padding:'24px 20px' }}>
          <AnimatePresence mode="wait">

            {/* Step 0 — Photos */}
            {step===0 && (
              <motion.div key="photos" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {Array(6).fill(null).map((_,i) => (
                    <div key={i} style={{ aspectRatio:'3/4', borderRadius:14, overflow:'hidden', position:'relative',
                      border:'2px dashed rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.05)' }}>
                      {photos[i] ? (
                        <>
                          <img src={photos[i].url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          <button onClick={()=>removePhoto(i)} style={{ position:'absolute',top:6,right:6,
                            background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',width:24,height:24,
                            color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                            <X size={14}/>
                          </button>
                          {i===0 && <div style={{ position:'absolute',bottom:6,left:6,background:'var(--gradient-primary)',
                            borderRadius:6,padding:'2px 8px',fontSize:'0.65rem',fontWeight:700,color:'#fff' }}>MAIN</div>}
                        </>
                      ) : (
                        <label style={{ width:'100%',height:'100%',display:'flex',flexDirection:'column',
                          alignItems:'center',justifyContent:'center',cursor:'pointer',gap:6 }}>
                          <Camera size={22} color="rgba(255,255,255,0.4)"/>
                          {i===0 && <span style={{color:'rgba(255,255,255,0.3)',fontSize:'0.7rem'}}>Add photo</span>}
                          <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={addPhoto}/>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', textAlign:'center', marginTop:14 }}>
                  Add up to 6 photos • First photo is your main photo
                </p>
              </motion.div>
            )}

            {/* Step 1 — About You */}
            {step===1 && (
              <motion.div key="about" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}}>
                <div style={{ marginBottom:20 }}>
                  <label style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600, display:'block', marginBottom:8 }}>
                    About You
                  </label>
                  <textarea id="profile-bio" rows={4} placeholder="Write a short, genuine bio..." value={form.bio}
                    onChange={e=>setForm(p=>({...p,bio:e.target.value}))}
                    style={{ width:'100%',padding:'12px 16px',borderRadius:12,fontSize:'0.95rem',resize:'none',
                      background:'rgba(255,255,255,0.1)',border:'2px solid rgba(255,255,255,0.2)',color:'#fff',
                      fontFamily:'inherit',outline:'none' }}/>
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', textAlign:'right', marginTop:4 }}>
                    {form.bio.length}/300
                  </div>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600, display:'block', marginBottom:10 }}>I am a</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {GENDERS.map(g => (
                      <button key={g} onClick={()=>setForm(p=>({...p,gender:g}))} style={chipStyle(form.gender===g)}>{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600, display:'block', marginBottom:10 }}>Interested in</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {LOOKING.map(l => (
                      <button key={l} onClick={()=>setForm(p=>({...p,lookingFor:l}))} style={chipStyle(form.lookingFor===l)}>{l}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Interests */}
            {step===2 && (
              <motion.div key="interests" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}}>
                <label style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600, display:'block', marginBottom:12 }}>
                  Your Interests <span style={{color:'rgba(255,255,255,0.35)'}}>({form.interests.length} selected)</span>
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {INTERESTS.map(it => (
                    <button key={it} onClick={()=>toggle('interests',it)} style={chipStyle(form.interests.includes(it))}>{it}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3 — Date Preferences */}
            {step===3 && (
              <motion.div key="prefs" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}}>
                {[
                  { label:'Favourite Cuisines', field:'cuisinePreferences', items:CUISINES },
                  { label:'Movie Genres', field:'movieGenres', items:GENRES },
                  { label:'Date Ambience', field:'ambiencePreferences', items:AMBIENCE },
                ].map(({label,field,items}) => (
                  <div key={field} style={{ marginBottom:20 }}>
                    <label style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600, display:'block', marginBottom:10 }}>{label}</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {items.map(it => (
                        <button key={it} onClick={()=>toggle(field,it)} style={chipStyle(form[field].includes(it))}>{it}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <label style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600, display:'block', marginBottom:8 }}>
                    Budget Range: ₹{form.budgetRange.min} – ₹{form.budgetRange.max}
                  </label>
                  <input type="range" min={200} max={10000} step={200}
                    value={form.budgetRange.max}
                    onChange={e=>setForm(p=>({...p,budgetRange:{...p.budgetRange,max:+e.target.value}}))}
                    style={{ width:'100%', accentColor:'#f43f5e' }}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav */}
          <div style={{ display:'flex', gap:12, marginTop:24 }}>
            {step>0 && (
              <button onClick={()=>setStep(s=>s-1)} className="btn btn-outline btn-lg"
                style={{ flex:1, borderColor:'rgba(255,255,255,0.3)', color:'rgba(255,255,255,0.7)' }}>← Back</button>
            )}
            {step < STEPS.length - 1
              ? <button id="profile-next" onClick={()=>setStep(s=>s+1)} className="btn btn-primary btn-lg" style={{flex:1}}>
                  Next <ChevronRight size={18}/>
                </button>
              : <button id="profile-finish" onClick={handleFinish} className="btn btn-primary btn-lg" style={{flex:1}} disabled={loading}>
                  {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : '💘 Let\'s Go!'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
