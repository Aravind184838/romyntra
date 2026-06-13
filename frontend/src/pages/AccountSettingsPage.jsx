import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Lock, Key, Trash2, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('email');
  const [loading, setLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [phoneForm, setPhoneForm] = useState({ newPhone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const changeEmail = async e => {
    e.preventDefault();
    setLoading(true);
    try { await api.put('/auth/change-email', emailForm); toast.success('Email updated! Please verify.'); setEmailForm({newEmail:'',password:''}); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const changePhone = async e => {
    e.preventDefault();
    setLoading(true);
    try { await api.put('/auth/change-phone', phoneForm); toast.success('Phone updated! Please verify.'); setPhoneForm({newPhone:''}); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const changePassword = async e => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try { await api.put('/auth/change-password', { currentPassword: passwordForm.current, newPassword: passwordForm.newPass }); toast.success('Password changed!'); setPasswordForm({current:'',newPass:'',confirm:''}); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/auth/account');
      toast.success('Account deleted. Sorry to see you go.');
      logout();
      navigate('/login', { replace: true });
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const tabs = [
    { id:'email', label:'Email', icon:<Mail size={16}/> },
    { id:'phone', label:'Phone', icon:<Phone size={16}/> },
    { id:'password', label:'Password', icon:<Lock size={16}/> },
    { id:'danger', label:'Danger Zone', icon:<AlertTriangle size={16}/> },
  ];

  const input = (key, val, setter, placeholder, type='text') => (
    <input type={type} value={val} onChange={e=>setter(p=>({...p,[key]:e.target.value}))} placeholder={placeholder}
      style={{ width:'100%', padding:'12px', borderRadius:12, border:'2px solid var(--gray-200)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', marginBottom:10 }}
      onFocus={e=>e.target.style.borderColor='var(--rose-400)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)' }}>
      <div style={{ background:'var(--gradient-dark)', padding:'16px 20px' }}>
        <div style={{ maxWidth:480, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}><ArrowLeft size={20}/></button>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#fff' }}>Account Settings</h1>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'8px 14px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.82rem', fontFamily:'Outfit,sans-serif', display:'flex', alignItems:'center', gap:6,
                background: tab===t.id ? 'var(--gradient-primary)' : '#fff', color: tab===t.id ? '#fff' : 'var(--gray-500)',
                boxShadow: tab===t.id ? 'var(--shadow-rose)' : 'var(--shadow-sm)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'email' && (
          <motion.form initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} onSubmit={changeEmail}
            style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'var(--shadow-sm)' }}>
            <p style={{ color:'var(--gray-500)', fontSize:'0.85rem', marginBottom:16 }}>Current email: <strong>{user?.email}</strong></p>
            {input('newEmail', emailForm.newEmail, setEmailForm, 'New email address', 'email')}
            {input('password', emailForm.password, setEmailForm, 'Enter your password to confirm', 'password')}
            <button type="submit" disabled={loading} className="btn btn-primary btn-full">{loading ? <Loader2 size={16} className="spinner"/> : <><CheckCircle size={16}/> Change Email</>}</button>
          </motion.form>
        )}

        {tab === 'phone' && (
          <motion.form initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} onSubmit={changePhone}
            style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'var(--shadow-sm)' }}>
            <p style={{ color:'var(--gray-500)', fontSize:'0.85rem', marginBottom:16 }}>Current phone: <strong>{user?.phone || 'Not set'}</strong></p>
            {input('newPhone', phoneForm.newPhone, setPhoneForm, 'New phone number (with country code)', 'tel')}
            <button type="submit" disabled={loading} className="btn btn-primary btn-full">{loading ? <Loader2 size={16} className="spinner"/> : <><CheckCircle size={16}/> Change Phone</>}</button>
          </motion.form>
        )}

        {tab === 'password' && (
          <motion.form initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} onSubmit={changePassword}
            style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'var(--shadow-sm)' }}>
            <p style={{ color:'var(--gray-500)', fontSize:'0.85rem', marginBottom:16 }}>Change your account password</p>
            {input('current', passwordForm.current, setPasswordForm, 'Current password', 'password')}
            {input('newPass', passwordForm.newPass, setPasswordForm, 'New password (min 8 chars, upper+lower+number+special)', 'password')}
            {input('confirm', passwordForm.confirm, setPasswordForm, 'Confirm new password', 'password')}
            <button type="submit" disabled={loading} className="btn btn-primary btn-full">{loading ? <Loader2 size={16} className="spinner"/> : <><Key size={16}/> Change Password</>}</button>
          </motion.form>
        )}

        {tab === 'danger' && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
            <div style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'var(--shadow-sm)', border:'2px solid #fecdd3' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <AlertTriangle size={24} color="#dc2626"/>
                <div><h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'#dc2626' }}>Danger Zone</h3><p style={{ color:'var(--gray-500)', fontSize:'0.82rem' }}>Irreversible actions</p></div>
              </div>

              <div style={{ padding:'14px', background:'#fff1f2', borderRadius:12, marginBottom:12 }}>
                <p style={{ fontWeight:600, color:'var(--gray-900)', marginBottom:4 }}>Delete Account</p>
                <p style={{ fontSize:'0.8rem', color:'var(--gray-500)', marginBottom:10 }}>Permanently delete your account and all data. This cannot be undone.</p>
                {!showDeleteConfirm ? (
                  <button onClick={()=>setShowDeleteConfirm(true)} style={{ padding:'8px 16px', borderRadius:10, border:'2px solid #dc2626', background:'#fff', color:'#dc2626', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>
                    <Trash2 size={14} style={{display:'inline',marginRight:6}}/> Delete My Account
                  </button>
                ) : (
                  <div>
                    <p style={{ color:'#dc2626', fontWeight:600, fontSize:'0.85rem', marginBottom:10 }}>Are you sure? This action is permanent!</p>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={deleteAccount} disabled={loading} style={{ flex:1, padding:'9px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        {loading ? <Loader2 size={15} className="spinner"/> : <><Trash2 size={15}/> Yes, Delete</>}
                      </button>
                      <button onClick={()=>setShowDeleteConfirm(false)} style={{ flex:1, padding:'9px', borderRadius:10, border:'2px solid var(--gray-200)', background:'#fff', color:'var(--gray-600)', fontWeight:600, cursor:'pointer' }}>
                        <XCircle size={15} style={{display:'inline',marginRight:4}}/> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <Navbar/>
    </div>
  );
}