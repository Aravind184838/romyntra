import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const STEPS = ['Account', 'Personal', 'Terms'];

export default function SignupPage() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const [step, setStep]     = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [form, setForm] = useState({
    name:'', email:'', phone:'', password:'', confirmPassword:'', dateOfBirth:'', agreeTerms:false,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.name.trim())   e.name = 'Name is required';
      if (!form.email)         e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
      if (!form.password)      e.password = 'Password is required';
      else if (form.password.length < 8) e.password = 'Min 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (step === 1) {
      if (!form.phone)       e.phone = 'Phone is required';
      if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
      else {
        const age = Math.floor((Date.now() - new Date(form.dateOfBirth)) / (365.25*24*60*60*1000));
        if (age < 18) e.dateOfBirth = 'You must be 18 or older';
      }
    }
    if (step === 2 && !form.agreeTerms) e.agreeTerms = 'You must accept the terms';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s+1); };
  const handleBack = () => { setStep(s => s-1); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const data = await register({
        name: form.name,
        email: form.email,
        phone: form.phone.trim(),
        password: form.password,
        dob: form.dateOfBirth,
        gender: 'not-specified',
      });

      toast.success('Account created! Verify your phone with OTP.');
      if (data.devOtp) {
        toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 12000 });
      }
      navigate('/verify-otp', {
        state: { email: form.email, phone: form.phone.trim() },
        replace: true,
      });
    } catch (err) {
      console.error('Signup Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const iStyle = { background:'rgba(255,255,255,0.1)', border:'2px solid rgba(255,255,255,0.2)', color:'#fff' };
  const lStyle = { color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', fontWeight:600 };

  return (
    <div className="page-auth" style={{ justifyContent:'center', padding:'24px 20px', overflowY:'auto' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-20%', right:'-15%', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(244,63,94,0.2) 0%,transparent 70%)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', left:'-15%', width:350, height:350, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(168,85,247,0.2) 0%,transparent 70%)', filter:'blur(60px)' }}/>
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
        style={{ width:'100%', maxWidth:420, zIndex:1, paddingBottom:40 }}>
        <div className="text-center" style={{ marginBottom:24 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>💘</div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.8rem', fontWeight:800,
            background:'linear-gradient(135deg,#fff 0%,#fecdd3 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 }}>
            Join Romyntra
          </h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem' }}>Your love story starts here</p>
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {STEPS.map((_,i) => (
            <div key={i} style={{ flex:1, height:4, borderRadius:2,
              background: i<step ? 'rgba(255,255,255,0.7)' : i===step ? '#fff' : 'rgba(255,255,255,0.25)',
              transition:'all 0.3s' }}/>
          ))}
        </div>
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', marginBottom:20 }}>
          Step {step+1} of {STEPS.length} — {STEPS[step]}
        </p>

        <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:24, padding:'28px 24px' }}>
          <AnimatePresence mode="wait">
            {step===0 && (
              <motion.div key="s0" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.25}}>
                {[
                  {id:'signup-name', label:'Full Name', field:'name', type:'text', icon:<User size={18}/>, ph:'Your full name'},
                  {id:'signup-email', label:'Email', field:'email', type:'email', icon:<Mail size={18}/>, ph:'you@example.com'},
                ].map(({id,label,field,type,icon,ph}) => (
                  <div className="input-group" key={field} style={{marginBottom:16}}>
                    <label style={lStyle}>{label}</label>
                    <div className="input-icon-wrap">
                      <span className="icon">{icon}</span>
                      <input id={id} type={type} className={`input${errors[field]?' error':''}`}
                        placeholder={ph} value={form[field]} onChange={e=>set(field,e.target.value)} style={iStyle}/>
                    </div>
                    {errors[field] && <p className="input-error">{errors[field]}</p>}
                  </div>
                ))}
                <div className="input-group" style={{marginBottom:16}}>
                  <label style={lStyle}>Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={18} className="icon"/>
                    <input id="signup-password" type={showPw?'text':'password'} className={`input${errors.password?' error':''}`}
                      placeholder="Min 8 characters" value={form.password} onChange={e=>set('password',e.target.value)}
                      style={{...iStyle,paddingRight:44}}/>
                    <button type="button" onClick={()=>setShowPw(p=>!p)}
                      style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
                        color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer'}}>
                      {showPw?<EyeOff size={18}/>:<Eye size={18}/>}
                    </button>
                  </div>
                  {errors.password && <p className="input-error">{errors.password}</p>}
                </div>
                <div className="input-group">
                  <label style={lStyle}>Confirm Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={18} className="icon"/>
                    <input type="password" className={`input${errors.confirmPassword?' error':''}`}
                      placeholder="Repeat password" value={form.confirmPassword}
                      onChange={e=>set('confirmPassword',e.target.value)} style={iStyle}/>
                  </div>
                  {errors.confirmPassword && <p className="input-error">{errors.confirmPassword}</p>}
                </div>
              </motion.div>
            )}

            {step===1 && (
              <motion.div key="s1" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.25}}>
                <div className="input-group" style={{marginBottom:16}}>
                  <label style={lStyle}>Phone Number</label>
                  <div className="input-icon-wrap">
                    <Phone size={18} className="icon"/>
                    <input id="signup-phone" type="tel" className={`input${errors.phone?' error':''}`}
                      placeholder="+919876543210" value={form.phone} onChange={e=>set('phone',e.target.value)} style={iStyle}/>
                  </div>
                  {errors.phone && <p className="input-error">{errors.phone}</p>}
                </div>
                <div className="input-group">
                  <label style={lStyle}>Date of Birth</label>
                  <div className="input-icon-wrap">
                    <Calendar size={18} className="icon"/>
                    <input id="signup-dob" type="date" className={`input${errors.dateOfBirth?' error':''}`}
                      value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)}
                      max={new Date(Date.now()-18*365.25*24*60*60*1000).toISOString().split('T')[0]}
                      style={{...iStyle,colorScheme:'dark'}}/>
                  </div>
                  {errors.dateOfBirth && <p className="input-error">{errors.dateOfBirth}</p>}
                </div>
              </motion.div>
            )}

            {step===2 && (
              <motion.div key="s2" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.25}}>
                <div style={{textAlign:'center',padding:'8px 0 20px'}}>
                  <div style={{fontSize:48,marginBottom:12}}>📋</div>
                  <h3 style={{color:'#fff',marginBottom:8,fontFamily:'Outfit,sans-serif'}}>Almost there!</h3>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:'0.85rem',lineHeight:1.6}}>
                    By joining Romyntra you agree to our Terms of Service and Privacy Policy. You confirm you are 18+ and will treat all members with respect.
                  </p>
                </div>
                <label style={{display:'flex',alignItems:'flex-start',gap:12,cursor:'pointer'}}>
                  <input id="signup-terms" type="checkbox" checked={form.agreeTerms}
                    onChange={e=>set('agreeTerms',e.target.checked)}
                    style={{width:20,height:20,accentColor:'#f43f5e',flexShrink:0,marginTop:2}}/>
                  <span style={{color:'rgba(255,255,255,0.7)',fontSize:'0.9rem',lineHeight:1.5}}>
                    I agree to the <span style={{color:'#fb7185'}}>Terms of Service</span> and <span style={{color:'#fb7185'}}>Privacy Policy</span>
                  </span>
                </label>
                {errors.agreeTerms && <p className="input-error" style={{marginTop:8}}>{errors.agreeTerms}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{display:'flex',gap:12,marginTop:24}}>
            {step>0 && (
              <button onClick={handleBack} className="btn btn-outline btn-lg"
                style={{flex:1,borderColor:'rgba(255,255,255,0.3)',color:'rgba(255,255,255,0.7)'}}>← Back</button>
            )}
            {step < STEPS.length-1
              ? <button id="signup-next" onClick={handleNext} className="btn btn-primary btn-lg" style={{flex:1}}>Next →</button>
              : <button id="signup-submit" onClick={handleSubmit} className="btn btn-primary btn-lg" style={{flex:1}} disabled={loading}>
                  {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : '🎉 Create Account'}
                </button>
            }
          </div>
        </div>

        <p style={{textAlign:'center',marginTop:20,color:'rgba(255,255,255,0.4)',fontSize:'0.9rem'}}>
          Already have an account? <Link to="/login" style={{color:'#fb7185',fontWeight:600}}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
