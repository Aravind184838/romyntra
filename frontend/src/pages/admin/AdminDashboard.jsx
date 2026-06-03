import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Heart, MessageCircle, Flag, TrendingUp, ArrowLeft, Shield, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setStats(r.data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { icon:<Users size={24}/>,        label:'Total Users',    value:stats.totalUsers,    color:'#3b82f6', bg:'#eff6ff' },
    { icon:<Heart size={24}/>,        label:'Total Matches',  value:stats.totalMatches,  color:'#f43f5e', bg:'#fff1f2' },
    { icon:<MessageCircle size={24}/>,label:'Messages Sent',  value:stats.totalMessages, color:'#8b5cf6', bg:'#f5f3ff' },
    { icon:<Flag size={24}/>,         label:'Pending Reports',value:stats.pendingReports, color:'#f59e0b', bg:'#fffbeb' },
    { icon:<TrendingUp size={24}/>,   label:'Active Users',   value:stats.activeUsers,   color:'#10b981', bg:'#ecfdf5' },
    { icon:<Users size={24}/>,        label:'Restricted Users',value:stats.restrictedUsers, color:'#06b6d4', bg:'#ecfeff' },
  ] : [];

  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background:'var(--gradient-dark)', padding:'20px 24px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate('/profile')}
            style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10,
              width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', cursor:'pointer' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'#fff' }}>
              <Shield size={20} style={{ display:'inline', marginRight:8, verticalAlign:'middle' }}/>
              Admin Dashboard
            </h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.85rem' }}>Platform overview & moderation</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px' }}>
        {/* Quick nav */}
        <div style={{ display:'flex', gap:10, marginBottom:24 }}>
          {[
            { label:'👥 Users', path:'/admin/users' },
            { label:'🚩 Reports', path:'/admin/reports' },
          ].map(n => (
            <button key={n.path} onClick={()=>navigate(n.path)}
              className="btn btn-outline" style={{ flex:1 }}>
              {n.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div className="spinner" style={{ borderTopColor:'var(--rose-500)' }}/>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
              {cards.map((c, i) => (
                <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.07 }}
                  style={{ background:'#fff', borderRadius:18, padding:'20px 16px',
                    boxShadow:'var(--shadow-md)', textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:c.bg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:c.color, margin:'0 auto 12px' }}>
                    {c.icon}
                  </div>
                  <p style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.7rem', fontWeight:800,
                    color:'var(--gray-900)', marginBottom:4 }}>
                    {c.value ?? '—'}
                  </p>
                  <p style={{ color:'var(--gray-500)', fontSize:'0.78rem', fontWeight:500 }}>{c.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent Users */}
            {stats?.recentUsers?.length > 0 && (
              <div style={{ marginTop:28, background:'#fff', borderRadius:20, padding:'20px', boxShadow:'var(--shadow-md)' }}>
                <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)', marginBottom:16 }}>
                  <Users size={18} style={{ display:'inline', marginRight:8, verticalAlign:'middle', color:'var(--rose-500)' }}/>
                  Recent Users
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {stats.recentUsers.map(u => (
                    <div key={u._id} style={{ display:'flex', alignItems:'center', gap:12,
                      padding:'10px 14px', borderRadius:14, background:'var(--gray-50)' }}>
                      <img src={u.photos?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'?')}&background=f43f5e&color=fff&size=80`}
                        alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }}/>
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:600, color:'var(--gray-900)' }}>{u.name}</p>
                        <p style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>{u.email} · {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export section */}
            <div style={{ marginTop:28, background:'#fff', borderRadius:20, padding:'20px', boxShadow:'var(--shadow-md)' }}>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--gray-800)', marginBottom:4 }}>
                <FileSpreadsheet size={18} style={{ display:'inline', marginRight:8, verticalAlign:'middle', color:'var(--rose-500)' }}/>
                Data Export
              </h3>
              <p style={{ color:'var(--gray-400)', fontSize:'0.82rem', marginBottom:14 }}>Download data as Excel (.xlsx) or CSV files</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {[
                  { type:'users', label:'👥 Users' },
                  { type:'matches', label:'💘 Matches' },
                  { type:'messages', label:'💬 Messages' },
                  { type:'reports', label:'🚩 Reports' },
                  { type:'swipes', label:'👆 Swipes' },
                  { type:'all', label:'📦 All Data' },
                ].map(btn => (
                  <button key={btn.type} onClick={async () => {
                    try {
                      const res = await api.get(`/admin/export/${btn.type}`, { responseType:'blob' });
                      const url = URL.createObjectURL(new Blob([res.data]));
                      const a = document.createElement('a');
                      a.href = url;
                      const disp = res.headers['content-disposition'];
                      a.download = disp ? disp.split('filename="')[1]?.replace('"','') : `${btn.type}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      toast.success(`${btn.label} exported!`);
                    } catch { toast.error('Export failed'); }
                  }}
                    style={{ padding:'10px 16px', borderRadius:12, border:'1px solid var(--gray-200)',
                      background:'var(--gray-50)', cursor:'pointer', fontSize:'0.85rem', fontWeight:600,
                      color:'var(--gray-700)', fontFamily:'Outfit,sans-serif',
                      display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--rose-50)'; e.currentTarget.style.borderColor='var(--rose-300)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='var(--gray-50)'; e.currentTarget.style.borderColor='var(--gray-200)';}}>
                    <Download size={14}/> {btn.label}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:10 }}>
                {[
                  { type:'users', label:'👥 Users CSV' },
                  { type:'messages', label:'💬 Messages CSV' },
                  { type:'matches', label:'💘 Matches CSV' },
                  { type:'swipes', label:'👆 Swipes CSV' },
                ].map(btn => (
                  <button key={btn.type} onClick={async () => {
                    try {
                      const res = await api.get(`/admin/export-csv/${btn.type}`, { responseType:'blob' });
                      const url = URL.createObjectURL(new Blob([res.data]));
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${btn.type}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      toast.success(`${btn.label} exported!`);
                    } catch { toast.error('Export failed'); }
                  }}
                    style={{ padding:'8px 14px', borderRadius:12, border:'1px solid var(--gray-200)',
                      background:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
                      color:'var(--gray-600)', fontFamily:'Outfit,sans-serif',
                      display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#86efac';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='var(--gray-200)';}}>
                    <Download size={13}/> {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
