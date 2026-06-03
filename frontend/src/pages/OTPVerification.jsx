import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, sendOtp } = useAuth();
  const { email, phone, isLogin } = location.state || {};

  const [otp, setOtp]         = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCount] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (!email && !phone) {
      toast.error('Session expired. Please sign up or log in again.');
      navigate(isLogin ? '/login' : '/signup', { replace: true });
    }
  }, [email, phone, isLogin, navigate]);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCount(c => c-1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i+1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key==='Backspace' && !otp[i] && i>0) inputs.current[i-1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    const next = text.split('').concat(Array(6).fill('')).slice(0,6);
    setOtp(next);
    inputs.current[Math.min(text.length,5)]?.focus();
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }

    if (!email && !phone) {
      toast.error('Session expired. Please try again.');
      navigate(isLogin ? '/login' : '/signup', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp({ email, phone, otp: code });
      toast.success(isLogin ? `Welcome back, ${data.user.name.split(' ')[0]}! 💘` : 'Phone verified! 🎉');
      navigate(data.user.isProfileComplete ? '/discover' : '/setup-profile', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      const data = await sendOtp({ email, phone });
      setCount(60);
      setCanResend(false);
      toast.success('OTP resent!');
      if (data.devOtp) {
        toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 12000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not resend OTP');
    }
  };

  const displayTarget = phone || email;

  return (
    <div className="page-auth" style={{ justifyContent:'center', alignItems:'center', padding:24 }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)',
          width:500, height:500, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(244,63,94,0.15) 0%,transparent 70%)', filter:'blur(60px)' }}/>
      </div>

      <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.4}}
        style={{ width:'100%', maxWidth:380, zIndex:1, textAlign:'center' }}>
        <motion.div animate={{scale:[1,1.08,1]}} transition={{duration:2,repeat:Infinity}} style={{fontSize:64,marginBottom:16}}>
          📱
        </motion.div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.9rem', fontWeight:800, color:'#fff', marginBottom:8 }}>
          Verify Your Phone
        </h1>
        <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:36, fontSize:'0.95rem', lineHeight:1.6 }}>
          Enter the 6-digit code for<br/>
          <strong style={{ color:'rgba(255,255,255,0.8)' }}>{displayTarget}</strong>
          <br/>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.8rem' }}>
            (Dev mode: use <strong style={{color:'#fb7185'}}>123456</strong> or check the toast after signup)
          </span>
        </p>

        <div className="otp-input-group" style={{ marginBottom:32 }} onPaste={handlePaste}>
          {otp.map((d,i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={el => inputs.current[i]=el}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{ borderColor: d ? 'var(--rose-400)' : undefined }}
            />
          ))}
        </div>

        <button id="otp-verify" onClick={handleVerify} className="btn btn-primary btn-full btn-lg"
          style={{ marginBottom:20 }} disabled={loading || otp.join('').length < 6}>
          {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2,borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)'}}/> : '✓ Verify Code'}
        </button>

        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem' }}>
          {canResend ? (
            <button id="otp-resend" onClick={resendOTP}
              style={{ color:'#fb7185', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem' }}>
              Resend OTP
            </button>
          ) : (
            <span>Resend code in <strong style={{color:'rgba(255,255,255,0.7)'}}>{countdown}s</strong></span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
