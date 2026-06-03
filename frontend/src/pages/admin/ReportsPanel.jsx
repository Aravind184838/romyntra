import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUS_STYLES = {
  pending:  { bg:'#fffbeb', color:'#d97706', icon:<Clock size={14}/>,         label:'Pending'  },
  resolved: { bg:'#ecfdf5', color:'#10b981', icon:<CheckCircle size={14}/>,   label:'Resolved' },
  dismissed:{ bg:'#f1f5f9', color:'#64748b', icon:<XCircle size={14}/>,       label:'Dismissed'},
  actioned: { bg:'#fff1f2', color:'#f43f5e', icon:<AlertTriangle size={14}/>, label:'Actioned' },
};

export default function ReportsPanel() {
  const navigate  = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('pending');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/admin/reports')
      .then(r => setReports(r.data.reports || []))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const updateReport = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      setReports(p => p.map(r => r._id===id ? {...r,status} : r));
      toast.success(`Report marked as ${status}`);
      setExpanded(null);
    } catch (err) { toast.error(err.message); }
  };

  const filtered = reports.filter(r => filter==='all' || r.status===filter);
  const avatar   = (u) => u?.photos?.[0]?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name||'?')}&background=f43f5e&color=fff&size=80`;

  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)' }}>
      <div style={{ background:'var(--gradient-dark)', padding:'20px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate('/admin')}
            style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10,
              width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', cursor:'pointer' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'#fff' }}>
              🚩 Reports Panel
            </h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem' }}>{filtered.length} reports</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'16px' }}>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
          {['all','pending','resolved','dismissed','actioned'].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer',
                fontWeight:600, fontSize:'0.82rem', fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap',
                background: filter===f ? 'var(--gradient-primary)' : '#fff',
                color: filter===f ? '#fff' : 'var(--gray-500)',
                boxShadow: filter===f ? 'var(--shadow-rose)' : 'var(--shadow-sm)',
                transition:'all 0.2s' }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {f==='pending' && reports.filter(r=>r.status==='pending').length > 0 && (
                <span style={{ marginLeft:6, background:'var(--rose-500)', color:'#fff',
                  borderRadius:10, padding:'1px 6px', fontSize:'0.7rem' }}>
                  {reports.filter(r=>r.status==='pending').length}
                </span>
              )}
            </button>
          ))}
          <button onClick={async () => {
            try {
              const res = await api.get('/admin/export/reports', { responseType:'blob' });
              const url = URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement('a'); a.href = url;
              a.download = `reports_${Date.now()}.xlsx`;
              document.body.appendChild(a); a.click(); a.remove();
              URL.revokeObjectURL(url);
              toast.success('Reports exported!');
            } catch { toast.error('Export failed'); }
          }}
            style={{ padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer',
              fontWeight:600, fontSize:'0.82rem', fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap',
              background:'#fff', color:'var(--gray-500)', boxShadow:'var(--shadow-sm)',
              display:'flex', alignItems:'center', gap:6 }}>
            <Download size={14}/> Export
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div className="spinner" style={{ borderTopColor:'var(--rose-500)' }}/>
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--gray-400)' }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
            <p>No {filter==='all'?'':filter} reports</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((r, i) => {
              const s = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
              return (
                <motion.div key={r._id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.04 }}
                  style={{ background:'#fff', borderRadius:16, padding:'16px',
                    boxShadow:'var(--shadow-sm)', border:`2px solid ${expanded===r._id ? 'var(--rose-200)':'transparent'}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}
                    onClick={()=>setExpanded(expanded===r._id ? null : r._id)}>
                    {/* Reporter */}
                    <img src={avatar(r.reporter)} alt=""
                      style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <p style={{ fontWeight:700, color:'var(--gray-900)', fontFamily:'Outfit,sans-serif', fontSize:'0.95rem' }}>
                            {r.reporter?.name || 'User'} → {r.reported?.name || 'User'}
                          </p>
                          <p style={{ color:'var(--rose-500)', fontWeight:600, fontSize:'0.82rem', marginTop:2 }}>
                            {r.reason}
                          </p>
                        </div>
                        <span style={{ display:'flex', alignItems:'center', gap:4, background:s.bg,
                          color:s.color, borderRadius:20, padding:'3px 10px', fontSize:'0.72rem',
                          fontWeight:700, flexShrink:0, marginLeft:8 }}>
                          {s.icon}{s.label}
                        </span>
                      </div>
                      <p style={{ color:'var(--gray-400)', fontSize:'0.75rem', marginTop:4 }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {expanded===r._id && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                      style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--gray-100)' }}>
                      {r.description && (
                        <p style={{ color:'var(--gray-600)', fontSize:'0.88rem', lineHeight:1.6, marginBottom:14,
                          background:'var(--gray-50)', borderRadius:10, padding:'10px 12px' }}>
                          "{r.description}"
                        </p>
                      )}
                      {r.status==='pending' && (
                        <div style={{ display:'flex', gap:8 }}>
                          <button id={`report-resolve-${r._id}`} onClick={()=>updateReport(r._id,'resolved')}
                            style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
                              background:'#ecfdf5', color:'#10b981', fontWeight:600, fontSize:'0.82rem',
                              display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <CheckCircle size={15}/> Resolve
                          </button>
                          <button id={`report-action-${r._id}`} onClick={()=>updateReport(r._id,'actioned')}
                            style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
                              background:'#fff1f2', color:'var(--rose-500)', fontWeight:600, fontSize:'0.82rem',
                              display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <AlertTriangle size={15}/> Take Action
                          </button>
                          <button id={`report-dismiss-${r._id}`} onClick={()=>updateReport(r._id,'dismissed')}
                            style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
                              background:'#f1f5f9', color:'var(--gray-500)', fontWeight:600, fontSize:'0.82rem',
                              display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <XCircle size={15}/> Dismiss
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
