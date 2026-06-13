import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, sendOtp } = useAuth();
  const navigate  = useNavigate();
  const [method, setMethod]   = useState('email'); // 'email' or 'phone'
  const [form, setForm]       = useState({ email: '', password: '', phone: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (method === 'email') {
      if (!form.email)    e.email    = 'Email is required';
      if (!form.password) e.password = 'Password is required';
    } else {
      if (!form.phone)    e.phone    = 'Phone is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (method === 'email') {
        const data = await login(form.email, form.password);
        const firstName = data.user?.name?.split(' ')[0] || 'there';
        toast.success(`Welcome back, ${firstName}! 💘`);
        navigate(data.user?.isProfileComplete ? '/discover' : '/setup-profile', { replace: true });
      } else {
        await sendOtp({ phone: form.phone.trim() });
        toast.success('OTP sent! 📱');
        navigate('/verify-otp', { state: { phone: form.phone.trim(), isLogin: true }, replace: true });
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Login failed';
      const hint = msg.includes('Invalid email')
        ? ' Wrong email/password — try any demo account (email: Demo@123)'
        : '';
      toast.error(msg + hint, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-auth" style={{ justifyContent: 'center', padding: '24px 20px' }}>
      {/* Background blobs */}
      <div style={{
        position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0,
      }}>
        <div style={{ position:'absolute', top:'-20%', right:'-15%', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(244,63,94,0.2) 0%, transparent 70%)', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-15%', width:350, height:350, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', filter:'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity:0, y:24 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5 }}
        style={{ width:'100%', maxWidth:400, zIndex:1 }}
      >
        {/* Header */}
        <div className="text-center" style={{ marginBottom:36 }}>
          <motion.div
            animate={{ scale:[1,1.1,1] }}
            transition={{ duration:2, repeat:Infinity }}
            style={{ fontSize:52, marginBottom:12 }}
          >💘</motion.div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'2rem', fontWeight:800,
            background:'linear-gradient(135deg,#fff 0%,#fecdd3 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:6 }}>
            Welcome back
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontFamily:'Inter,sans-serif' }}>
            Sign in to continue your love story
          </p>
        </div>

        {/* Form card */}
        <div className="card-glass" style={{ padding:'32px 28px', borderRadius:24,
          background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)' }}>
          
          {/* Method Toggle */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:4, marginBottom:24 }}>
            <button onClick={() => setMethod('email')} 
              style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
                background: method === 'email' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: method === 'email' ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize:'0.85rem', fontWeight:600, transition:'all 0.2s' }}>Email</button>
            <button onClick={() => setMethod('phone')}
              style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
                background: method === 'phone' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: method === 'phone' ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize:'0.85rem', fontWeight:600, transition:'all 0.2s' }}>Phone</button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {method === 'email' ? (
              <>
                {/* Email */}
                <div className="input-group" style={{ marginBottom:18 }}>
                  <label className="input-label" style={{ color:'rgba(255,255,255,0.75)' }}>Email</label>
                  <div className="input-icon-wrap">
                    <Mail size={18} className="icon" />
                    <input
                      id="login-email"
                      type="email"
                      className={`input${errors.email?' error':''}`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm(p=>({...p,email:e.target.value}))}
                      style={{ background:'rgba(255,255,255,0.1)', border:'2px solid rgba(255,255,255,0.2)', color:'#fff' }}
                    />
                  </div>
                  {errors.email && <p className="input-error">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="input-group" style={{ marginBottom:24 }}>
                  <label className="input-label" style={{ color:'rgba(255,255,255,0.75)' }}>Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={18} className="icon" />
                    <input
                      id="login-password"
                      type={showPw ? 'text' : 'password'}
                      className={`input${errors.password?' error':''}`}
                      placeholder="Your password"
                      value={form.password}
                      onChange={e => setForm(p=>({...p,password:e.target.value}))}
                      style={{ background:'rgba(255,255,255,0.1)', border:'2px solid rgba(255,255,255,0.2)',
                        color:'#fff', paddingRight:44 }}
                    />
                    <button type="button" onClick={()=>setShowPw(p=>!p)}
                      style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                        color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer' }}>
                      {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  {errors.password && <p className="input-error">{errors.password}</p>}
                </div>
              </>
            ) : (
              <div className="input-group" style={{ marginBottom:24 }}>
                <label className="input-label" style={{ color:'rgba(255,255,255,0.75)' }}>Phone Number</label>
                <div className="input-icon-wrap">
                  <span className="icon" style={{color:'rgba(255,255,255,0.5)', fontSize:'0.9rem', fontWeight:600}}>📱</span>
                  <input
                    id="login-phone"
                    type="tel"
                    className={`input${errors.phone?' error':''}`}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm(p=>({...p,phone:e.target.value}))}
                    style={{ background:'rgba(255,255,255,0.1)', border:'2px solid rgba(255,255,255,0.2)', color:'#fff' }}
                  />
                </div>
                {errors.phone && <p className="input-error">{errors.phone}</p>}
              </div>
            )}

            <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}} /> : (
                <><Heart size={18}/> Sign In</>
              )}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:20, color:'rgba(255,255,255,0.5)', fontSize:'0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color:'#fb7185', fontWeight:600 }}>Sign up</Link>
          </div>

        </div>

        {method === 'email' && (
          <div style={{ marginTop:16, textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:'0.75rem', lineHeight:1.7 }}>
            Demo accounts (password: <strong style={{color:'rgba(255,255,255,0.55)'}}>Demo@123</strong>):
            <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'4px 12px', marginTop:4}}>
              <span style={{color:'rgba(255,255,255,0.55)'}}>priya@demo.com</span>
              <span style={{color:'rgba(255,255,255,0.55)'}}>aarav@demo.com</span>
              <span style={{color:'rgba(255,255,255,0.55)'}}>rahul@demo.com</span>
              <span style={{color:'rgba(255,255,255,0.55)'}}>anjali@demo.com</span>
              <span style={{color:'rgba(255,255,255,0.55)'}}>sneha@demo.com</span>
            </div>
          </div>
        )}

        {/* Social logins (visual only) */}
        <div style={{ marginTop:24, textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.8rem', marginBottom:14 }}>or continue with</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            {['G', 'f', 'in'].map(s => (
              <button key={s} onClick={()=>toast('Social login coming soon!')}
                style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.1)',
                  border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontWeight:700,
                  fontSize:'0.9rem', cursor:'pointer', transition:'all 0.2s' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
