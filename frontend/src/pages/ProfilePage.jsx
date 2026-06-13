import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Edit3, LogOut, Shield, ChevronRight, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const INTERESTS = ['Hiking','Photography','Cooking','Travel','Music','Art','Reading','Gaming',
  'Yoga','Dancing','Fitness','Movies','Coffee','Wine','Pets','Foodie','Tech','Fashion'];

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef  = useRef(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bio: user?.bio || '',
    interests: user?.interests || [],
  });

  const avatar = user?.photos?.[0]?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'?')}&background=f43f5e&color=fff&size=200`;

  const age = user?.dob
    ? Math.floor((Date.now() - new Date(user.dob)) / (365.25*24*60*60*1000))
    : user?.age || '';

  const toggle = (it) => setForm(p => ({
    ...p,
    interests: p.interests.includes(it) ? p.interests.filter(x=>x!==it) : [...p.interests, it],
  }));

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', { bio: form.bio, interests: form.interests });
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    toast.success('Logged out. See you soon! 👋');
  };

  const chipStyle = (active) => ({
    padding:'6px 14px', borderRadius:999, fontSize:'0.8rem', fontWeight:500, cursor:'pointer', border:'none',
    background: active ? 'var(--gradient-primary)' : 'var(--gray-100)',
    color: active ? '#fff' : 'var(--gray-600)',
    transition:'all 0.2s',
    boxShadow: active ? '0 2px 8px rgba(244,63,94,0.3)' : 'none',
  });

  return (
    <div className="page" style={{ background:'var(--gray-50)' }}>
      {/* Hero */}
      <div style={{ background:'var(--gradient-primary)', paddingTop:20, paddingBottom:60, position:'relative' }}>
        <div style={{ textAlign:'center', padding:'0 20px' }}>
          <div style={{ position:'relative', display:'inline-block', marginBottom:12 }}>
            <img src={avatar} alt={user?.name}
              style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover',
                border:'4px solid rgba(255,255,255,0.9)', boxShadow:'var(--shadow-lg)' }}/>
            <button onClick={()=>fileRef.current?.click()}
              style={{ position:'absolute', bottom:2, right:2, width:30, height:30, borderRadius:'50%',
                background:'#fff', border:'none', cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow-md)' }}>
              <Camera size={15} color="var(--rose-500)"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={async e => {
                const file = e.target.files[0]; if (!file) return;
                const fd = new FormData(); fd.append('photos', file);
                try {
                  const { data } = await api.put('/users/profile', fd);
                  updateUser(data.user); toast.success('Photo updated!');
                } catch (err) { toast.error(err.message); }
              }}/>
          </div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'#fff', marginBottom:4 }}>
            {user?.name}
          </h1>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.9rem' }}>
            {age ? `${age} years old` : ''} {user?.gender ? `· ${user.gender}` : ''}
          </p>
        </div>
      </div>

      {/* Content lifted over hero */}
      <div style={{ maxWidth:480, margin:'-36px auto 0', padding:'0 16px', position:'relative' }}>

        {/* Bio card */}
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'var(--shadow-md)', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)' }}>About Me</h3>
            <button onClick={()=>setEditing(p=>!p)}
              style={{ display:'flex', alignItems:'center', gap:6, color:'var(--rose-500)',
                background:'var(--rose-50)', border:'none', borderRadius:10, padding:'6px 12px',
                cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
              <Edit3 size={14}/>{editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div>
              <textarea rows={3} value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))}
                style={{ width:'100%', padding:'12px', borderRadius:12, border:'2px solid var(--rose-200)',
                  resize:'none', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', marginBottom:14 }}/>
              <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-600)', marginBottom:10 }}>Interests</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
                {INTERESTS.map(it => (
                  <button key={it} onClick={()=>toggle(it)} style={chipStyle(form.interests.includes(it))}>{it}</button>
                ))}
              </div>
              <button onClick={saveProfile} className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : '✓ Save Changes'}
              </button>
            </div>
          ) : (
            <>
              <p style={{ color:'var(--gray-600)', fontSize:'0.9rem', lineHeight:1.6, marginBottom:12 }}>
                {user?.bio || 'No bio yet. Add one!'}
              </p>
              {user?.interests?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {user.interests.map(it => (
                    <span key={it} style={{ ...chipStyle(true), cursor:'default' }}>{it}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'Matches', value:user?.matchCount||0 },
            { label:'Likes Given', value:user?.likesGiven||0 },
            { label:'Profile Views', value:user?.profileViews||0 },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:16, padding:'14px 10px',
              textAlign:'center', boxShadow:'var(--shadow-sm)' }}>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800,
                background:'var(--gradient-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {s.value}
              </p>
              <p style={{ color:'var(--gray-500)', fontSize:'0.75rem', fontWeight:500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings menu */}
        <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'var(--shadow-md)', marginBottom:14 }}>
          {[
            { icon:'🍽️', label:'Date Preferences', action:()=>navigate('/preferences') },
            { icon:'🔔', label:'Notifications', action:()=>navigate('/notifications') },
            { icon:'🔒', label:'Privacy Settings', action:()=>navigate('/privacy') },
            { icon:'⚙️', label:'Account Settings', action:()=>navigate('/account') },
            { icon:'💌', label:'Help & Support', action:()=>navigate('/help') },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px',
                background:'none', border:'none', cursor:'pointer', textAlign:'left',
                borderBottom: i<arr.length-1 ? '1px solid var(--gray-100)' : 'none',
                transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--gray-50)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ flex:1, fontWeight:500, color:'var(--gray-800)' }}>{item.label}</span>
              <ChevronRight size={16} color="var(--gray-300)"/>
            </button>
          ))}
        </div>

        {/* Admin link (if admin) */}
        {user?.role === 'admin' && (
          <button onClick={()=>navigate('/admin')} className="btn btn-outline btn-full"
            style={{ marginBottom:12, gap:8 }}>
            <Shield size={18}/> Admin Dashboard
          </button>
        )}

        {/* Logout */}
        <button id="btn-logout" onClick={handleLogout}
          style={{ width:'100%', padding:'16px', borderRadius:16, border:'2px solid #fecdd3',
            background:'#fff7f8', color:'var(--rose-500)', fontFamily:'Outfit,sans-serif',
            fontWeight:700, fontSize:'0.95rem', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center', gap:8, marginBottom:24,
            transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--rose-50)'; e.currentTarget.style.borderColor='var(--rose-400)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#fff7f8'; e.currentTarget.style.borderColor='#fecdd3';}}>
          <LogOut size={18}/> Sign Out
        </button>
      </div>

      <Navbar/>
    </div>
  );
}
