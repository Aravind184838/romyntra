import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, ChevronDown, Send, Loader2, Mail, HelpCircle, BookOpen, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/Navbar';

const FAQS = [
  { q:'How do I find matches?', a:'Swipe right on profiles you like in the Discover page. If they swipe right on you too, it\'s a match! You can then chat with them.' },
  { q:'How do I change my photos?', a:'Go to your Profile page and tap the camera icon on your profile photo to upload a new one.' },
  { q:'What is E2EE encryption?', a:'End-to-end encryption ensures your messages are private. Your private key is stored locally on your device and never shared.' },
  { q:'How do AI recommendations work?', a:'Based on your preferences and interests, our AI suggests restaurants, movies, and date plans for your matches.' },
  { q:'How do I report a user?', a:'Go to the profile of the user you want to report, and use the Report option. Our team will review it.' },
  { q:'Why can\'t I see certain profiles?', a:'You may have swiped on them already, or they might not be in your preferred age/gender range.' },
  { q:'How do I delete my account?', a:'Go to Account Settings and use the Danger Zone tab to permanently delete your account.' },
  { q:'Can I change my preferences?', a:'Yes! Go to Date Preferences in your profile settings to update cuisines, movie genres, and more.' },
];

export default function HelpSupportPage() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const sendSupport = async e => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) { toast.error('Please fill in all fields'); return; }
    setSending(true);
    try {
      await api.post('/users/support-ticket', contactForm);
      toast.success('Support ticket submitted! We\'ll get back to you soon.');
      setContactForm({ subject: '', message: '' });
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)' }}>
      <div style={{ background:'var(--gradient-dark)', padding:'16px 20px' }}>
        <div style={{ maxWidth:520, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}><ArrowLeft size={20}/></button>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#fff' }}>Help & Support</h1>
        </div>
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>

        {/* Quick contact card */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          style={{ background:'linear-gradient(135deg, var(--rose-500), #be185d)', borderRadius:18, padding:'20px', marginBottom:18, color:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <Mail size={24}/>
            <div><h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'1.1rem' }}>Need help?</h3><p style={{ opacity:0.8, fontSize:'0.85rem' }}>We typically respond within 24 hours</p></div>
          </div>
          <p style={{ fontSize:'0.85rem', opacity:0.9 }}>support@romyntra.com</p>
        </motion.div>

        {/* FAQ Section */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow-sm)', marginBottom:16 }}>
          <div style={{ padding:'16px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--gray-100)' }}>
            <HelpCircle size={18} color="var(--rose-500)"/>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)' }}>Frequently Asked Questions</h3>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button onClick={()=>setExpanded(expanded===i ? null : i)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'none', background:'none', cursor:'pointer', textAlign:'left', borderBottom: i<FAQS.length-1 ? '1px solid var(--gray-100)' : 'none' }}>
                <span style={{ flex:1, fontWeight:600, color:'var(--gray-800)', fontSize:'0.9rem' }}>{faq.q}</span>
                <motion.span animate={{ rotate: expanded===i ? 180 : 0 }} transition={{ duration:0.2 }}>
                  <ChevronDown size={16} color="var(--gray-400)"/>
                </motion.span>
              </button>
              <AnimatePresence>
                {expanded===i && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                    style={{ overflow:'hidden' }}>
                    <p style={{ padding:'0 16px 14px', color:'var(--gray-500)', fontSize:'0.85rem', lineHeight:1.6 }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Contact Form */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'var(--shadow-sm)', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <MessageCircle size={18} color="var(--rose-500)"/>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)' }}>Contact Us</h3>
          </div>
          <p style={{ color:'var(--gray-400)', fontSize:'0.82rem', marginBottom:14 }}>Have a question or issue? Send us a message and we'll help.</p>
          <input placeholder="Subject" value={contactForm.subject} onChange={e=>setContactForm(p=>({...p,subject:e.target.value}))}
            style={{ width:'100%', padding:'12px', borderRadius:12, border:'2px solid var(--gray-200)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', marginBottom:10 }}
            onFocus={e=>e.target.style.borderColor='var(--rose-400)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
          <textarea rows={4} placeholder="Describe your issue or question..." value={contactForm.message} onChange={e=>setContactForm(p=>({...p,message:e.target.value}))}
            style={{ width:'100%', padding:'12px', borderRadius:12, border:'2px solid var(--gray-200)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', resize:'vertical', marginBottom:14 }}
            onFocus={e=>e.target.style.borderColor='var(--rose-400)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
          <button onClick={sendSupport} disabled={sending} className="btn btn-primary btn-full">
            {sending ? <><Loader2 size={16} className="spinner"/> Sending...</> : <><Send size={16}/> Submit Ticket</>}
          </button>
        </motion.div>

        {/* App info */}
        <div style={{ textAlign:'center', padding:'20px', color:'var(--gray-400)', fontSize:'0.78rem' }}>
          <p>Romyntra v1.0.0</p>
          <p style={{ marginTop:2 }}>Made with ❤️ for meaningful connections</p>
        </div>
      </div>
      <Navbar/>
    </div>
  );
}