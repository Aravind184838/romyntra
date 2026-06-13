import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Globe, Lock, UserCheck, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function PrivacySettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showLocation: true,
    showAge: true,
    allowPhotosDownload: false,
    blockScreenshots: false,
    allowMessagesFrom: 'everyone',
    hideProfileFrom: 'none',
  });

  useEffect(() => {
    api.get('/users/privacy-settings')
      .then(r => setSettings(r.data.settings))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/privacy-settings', { settings });
      updateUser(data.user);
      toast.success('Privacy settings saved!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const toggleSwitch = (key) => (
    <button type="button" onClick={()=>toggle(key)} style={{
      width:48, height:28, borderRadius:14, border:'none', cursor:'pointer', position:'relative',
      background: settings[key] ? 'var(--gradient-primary)' : 'var(--gray-200)', transition:'all 0.2s', flexShrink:0
    }}>
      <span style={{
        position:'absolute', top:2, left: settings[key] ? 24 : 2, width:22, height:22, borderRadius:'50%',
        background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', transition:'left 0.2s'
      }}/>
    </button>
  );

  const select = (key, options) => (
    <select value={settings[key]} onChange={e=>setSettings(p=>({...p,[key]:e.target.value}))}
      style={{ padding:'6px 12px', borderRadius:10, border:'2px solid var(--gray-200)', fontFamily:'inherit', fontSize:'0.85rem', outline:'none', background:'#fff', cursor:'pointer', color:'var(--gray-700)' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)' }}>
      <div style={{ background:'var(--gradient-dark)', padding:'16px 20px' }}>
        <div style={{ maxWidth:480, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}><ArrowLeft size={20}/></button>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#fff' }}>Privacy Settings</h1>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px' }}>
        <p style={{ color:'var(--gray-500)', fontSize:'0.85rem', marginBottom:16 }}>Control your privacy and visibility on Romyntra</p>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <Eye size={18} color="var(--rose-500)"/> Profile Visibility
          </h3>
          {[
            ['showOnlineStatus', 'Online Status', 'Let others see when you\'re active'],
            ['showLocation', 'Show Location', 'Display your city on your profile'],
            ['showAge', 'Show Age', 'Display your age on your profile'],
          ].map(([key, label, desc]) => (
            <label key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--gray-100)', cursor:'pointer', gap:12 }}>
              <div style={{ flex:1 }}><p style={{ fontWeight:600, color:'var(--gray-900)', fontSize:'0.9rem' }}>{label}</p><p style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>{desc}</p></div>
              {toggleSwitch(key)}
            </label>
          ))}
        </motion.div>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <Lock size={18} color="var(--rose-500)"/> Security & Content
          </h3>
          {[
            ['allowPhotosDownload', 'Allow Photo Download', 'Let others download your photos'],
            ['blockScreenshots', 'Block Screenshots', 'Prevent screenshots in the app'],
          ].map(([key, label, desc]) => (
            <label key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--gray-100)', cursor:'pointer', gap:12 }}>
              <div style={{ flex:1 }}><p style={{ fontWeight:600, color:'var(--gray-900)', fontSize:'0.9rem' }}>{label}</p><p style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>{desc}</p></div>
              {toggleSwitch(key)}
            </label>
          ))}
        </motion.div>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <UserCheck size={18} color="var(--rose-500)"/> Who Can Reach You
          </h3>
          <div style={{ padding:'12px 0' }}>
            <p style={{ fontWeight:600, color:'var(--gray-900)', fontSize:'0.9rem', marginBottom:4 }}>Allow Messages From</p>
            <p style={{ fontSize:'0.75rem', color:'var(--gray-400)', marginBottom:8 }}>Who can send you messages</p>
            {select('allowMessagesFrom', [
              { value:'everyone', label:'Everyone' },
              { value:'matches', label:'Only Matches' },
              { value:'nobody', label:'Nobody' },
            ])}
          </div>
          <div style={{ padding:'12px 0', borderTop:'1px solid var(--gray-100)' }}>
            <p style={{ fontWeight:600, color:'var(--gray-900)', fontSize:'0.9rem', marginBottom:4 }}>Hide Profile From</p>
            <p style={{ fontSize:'0.75rem', color:'var(--gray-400)', marginBottom:8 }}>Who should not see your profile</p>
            {select('hideProfileFrom', [
              { value:'none', label:'No one' },
              { value:'everyone', label:'Everyone (hide profile)' },
              { value:'noPhotos', label:'Users without photos' },
              { value:'newUsers', label:'New users (< 1 week)' },
            ])}
          </div>
        </motion.div>

        <button onClick={save} disabled={saving} className="btn btn-primary btn-full">
          {saving ? <><Loader2 size={16} className="spinner"/> Saving...</> : <><Save size={16}/> Save Privacy Settings</>}
        </button>
      </div>
      <Navbar/>
    </div>
  );
}