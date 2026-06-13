import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Mail, MessageSquare, Heart, Zap, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function NotificationsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    push: { matches: true, messages: true, likes: true, superlikes: true, recommendations: false, promotions: false },
    email: { matches: true, messages: false, weeklyDigest: true, promotions: false },
    sms: { matches: false, messages: false, security: true },
  });

  useEffect(() => {
    api.get('/users/notification-preferences')
      .then(r => { setPrefs(r.data.preferences); setLoading(false); })
      .catch(() => { setPrefs({
        push: { matches: true, messages: true, likes: true, superlikes: true, recommendations: false, promotions: false },
        email: { matches: true, messages: false, weeklyDigest: true, promotions: false },
        sms: { matches: false, messages: false, security: true },
      }); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/notification-preferences', { preferences: prefs });
      updateUser(data.user);
      toast.success('Notification preferences saved!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const toggle = (category, key) => setPrefs(p => ({ ...p, [category]: { ...p[category], [key]: !p[category][key] } }));

  const section = (title, icon, items, category) => (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)' }}>{title}</h3>
      </div>
      {items.map(([key, label, desc]) => (
        <label key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--gray-100)', cursor:'pointer' }}>
          <div>
            <p style={{ fontWeight:600, color:'var(--gray-900)', fontSize:'0.9rem' }}>{label}</p>
            <p style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>{desc}</p>
          </div>
          <button type="button" onClick={()=>toggle(category, key)} style={{
            width:48, height:28, borderRadius:14, border:'none', cursor:'pointer', position:'relative',
            background: prefs[category][key] ? 'var(--gradient-primary)' : 'var(--gray-200)', transition:'all 0.2s'
          }}>
            <span style={{
              position:'absolute', top:2, left: prefs[category][key] ? 24 : 2, width:22, height:22, borderRadius:'50%',
              background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', transition:'left 0.2s'
            }}/>
          </button>
        </label>
      ))}
    </motion.div>
  );

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gradient-dark)' }}><div className="spinner" style={{ width:48, height:48, borderTopColor:'#f43f5e', borderColor:'rgba(255,255,255,0.2)' }}/></div>;

  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)' }}>
      <div style={{ background:'var(--gradient-dark)', padding:'16px 20px' }}>
        <div style={{ maxWidth:480, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}><ArrowLeft size={20}/></button>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#fff' }}>Notifications</h1>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px' }}>
        <p style={{ color:'var(--gray-500)', fontSize:'0.85rem', marginBottom:16 }}>Control how and when you receive notifications</p>

        {section('Push Notifications', '🔔', [
          ['matches', 'New Matches', 'When someone likes you back'],
          ['messages', 'New Messages', 'When you receive a message'],
          ['likes', 'New Likes', 'When someone likes your profile'],
          ['superlikes', 'Super Likes', 'When someone super likes you'],
          ['recommendations', 'Date Recommendations', 'New AI date ideas for your matches'],
          ['promotions', 'Promotions & Updates', 'App updates and special offers'],
        ], 'push')}

        {section('Email Notifications', '✉️', [
          ['matches', 'Match Alerts', 'Email me when I get a new match'],
          ['messages', 'Message Alerts', 'Email me when I receive a message'],
          ['weeklyDigest', 'Weekly Digest', 'Summary of your activity each week'],
          ['promotions', 'Promotional Emails', 'News, tips, and special offers'],
        ], 'email')}

        {section('SMS Notifications', '📱', [
          ['matches', 'Match Alerts', 'Text me when I get a new match'],
          ['messages', 'Message Alerts', 'Text me when I receive a message'],
          ['security', 'Security Alerts', 'Login alerts and account changes'],
        ], 'sms')}

        <button onClick={save} disabled={saving} className="btn btn-primary btn-full" style={{ marginTop:8 }}>
          {saving ? <><Loader2 size={16} className="spinner"/> Saving...</> : <><Save size={16}/> Save Preferences</>}
        </button>
      </div>
      <Navbar/>
    </div>
  );
}