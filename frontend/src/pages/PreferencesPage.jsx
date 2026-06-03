import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, Film, Music, DollarSign, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CUISINE_OPTIONS = ['Italian', 'Indian', 'Chinese', 'Mexican', 'Japanese', 'Continental', 'Thai', 'Korean', 'Mediterranean', 'French'];
const MOVIE_GENRES = ['Action', 'Romance', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Horror', 'Animation'];
const AMBIENCE_OPTIONS = ['Cozy', 'Romantic', 'Trendy', 'Outdoor', 'Rooftop', 'Casual', 'Luxury', 'Quiet'];
const INTEREST_OPTIONS = ['Hiking', 'Photography', 'Cooking', 'Travel', 'Music', 'Art', 'Reading', 'Gaming', 'Yoga', 'Dancing', 'Fitness', 'Movies', 'Coffee', 'Wine', 'Pets', 'Foodie', 'Tech', 'Fashion'];

export default function PreferencesPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    interests: [],
    cuisinePreferences: [],
    movieGenres: [],
    ambiencePreferences: [],
    budgetRange: { min: 500, max: 3000 },
  });

  useEffect(() => {
    if (user) {
      setForm({
        interests: user.interests || [],
        cuisinePreferences: user.cuisinePreferences || [],
        movieGenres: user.movieGenres || [],
        ambiencePreferences: user.ambiencePreferences || [],
        budgetRange: user.budgetRange || { min: 500, max: 3000 },
      });
    }
  }, [user]);

  const toggle = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      toast.success('Preferences saved! 💘');
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page" style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div style={{ background:'#fff', padding:'16px 20px', borderBottom:'1px solid var(--gray-100)',
        display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:10 }}>
        <button onClick={() => navigate(-1)} style={{ border:'none', background:'none', cursor:'pointer' }}>
          <ArrowLeft size={22} color="var(--gray-700)" />
        </button>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:700, flex:1 }}>
          Date Preferences
        </h1>
        <button onClick={handleSave} disabled={saving}
          style={{ border:'none', borderRadius:10, padding:'8px 16px', background:'var(--gradient-primary)',
            color:'#fff', fontWeight:600, fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          {saving ? <div className="spinner" style={{width:16,height:16,borderWidth:2}} /> : <Save size={16}/>}
          Save
        </button>
      </div>

      <div style={{ padding:16, maxWidth:500, margin:'0 auto' }}>
        {/* Interests */}
        <Section icon={<Music size={18}/>} title="Interests" subtitle="What do you love?">
          <ChipGrid options={INTEREST_OPTIONS} selected={form.interests} onClick={v => toggle('interests', v)} />
        </Section>

        {/* Cuisine */}
        <Section icon={<Utensils size={18}/>} title="Cuisine Preferences" subtitle="What food do you enjoy?">
          <ChipGrid options={CUISINE_OPTIONS} selected={form.cuisinePreferences} onClick={v => toggle('cuisinePreferences', v)} />
        </Section>

        {/* Movie Genres */}
        <Section icon={<Film size={18}/>} title="Movie Genres" subtitle="What movies do you like?">
          <ChipGrid options={MOVIE_GENRES} selected={form.movieGenres} onClick={v => toggle('movieGenres', v)} />
        </Section>

        {/* Ambience */}
        <Section icon={<Music size={18}/>} title="Ambience Preferences" subtitle="What vibe do you prefer for dates?">
          <ChipGrid options={AMBIENCE_OPTIONS} selected={form.ambiencePreferences} onClick={v => toggle('ambiencePreferences', v)} />
        </Section>

        {/* Budget */}
        <Section icon={<DollarSign size={18}/>} title="Budget Range" subtitle="How much would you spend on a date?">
          <div style={{ padding:'8px 0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', color:'var(--gray-500)', fontSize:'0.85rem', marginBottom:8 }}>
              <span>₹{(form.budgetRange.min || 0).toLocaleString()}</span>
              <span>₹{(form.budgetRange.max || 5000).toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
              <span style={{ fontSize:'0.8rem', color:'var(--gray-400)', minWidth:30 }}>Min</span>
              <input type="range" min={200} max={10000} step={200}
                value={form.budgetRange.min || 200}
                onChange={e => setForm(p => ({...p, budgetRange: {...p.budgetRange, min: parseInt(e.target.value)}}))}
                style={{ flex:1, accentColor:'var(--rose-500)' }} />
              <input type="range" min={200} max={10000} step={200}
                value={form.budgetRange.max || 5000}
                onChange={e => setForm(p => ({...p, budgetRange: {...p.budgetRange, max: parseInt(e.target.value)}}))}
                style={{ flex:1, accentColor:'var(--rose-500)' }} />
              <span style={{ fontSize:'0.8rem', color:'var(--gray-400)', minWidth:30 }}>Max</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <span style={{ color:'var(--rose-500)' }}>{icon}</span>
        <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'1rem', color:'var(--gray-800)' }}>{title}</h3>
      </div>
      <p style={{ color:'var(--gray-400)', fontSize:'0.8rem', marginBottom:12 }}>{subtitle}</p>
      {children}
    </motion.div>
  );
}

function ChipGrid({ options, selected, onClick }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} onClick={() => onClick(opt)}
            style={{
              padding:'6px 14px', borderRadius:20, border:'1px solid',
              borderColor: active ? 'var(--rose-500)' : 'var(--gray-200)',
              background: active ? 'var(--rose-50)' : '#fff',
              color: active ? 'var(--rose-600)' : 'var(--gray-600)',
              fontWeight: active ? 600 : 400,
              fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s'
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
