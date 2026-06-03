import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Ban, Trash2, CheckCircle, ChevronDown, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const restrict = async (id, isRestricted) => {
    try {
      await api.put(`/admin/users/${id}/restrict`, { restrict: !isRestricted });
      toast.success(isRestricted ? 'User unrestricted' : 'User restricted');
      setUsers(p => p.map(u => u._id===id ? {...u,isRestricted:!isRestricted} : u));
      setSelected(null);
    } catch (err) { toast.error(err.message); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      setUsers(p => p.filter(u => u._id!==id));
      setSelected(null);
    } catch (err) { toast.error(err.message); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchFilter = filter==='all' || (filter==='restricted' && u.isRestricted) || (filter==='unverified' && !u.isVerified);
    return matchSearch && matchFilter;
  });

  const avatar = (u) => u?.photos?.[0]?.url ||
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
              👥 User Management
            </h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem' }}>{filtered.length} users</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'16px' }}>
        {/* Search + filter */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)' }}/>
            <input placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'11px 12px 11px 36px', borderRadius:12, border:'2px solid var(--gray-200)',
                fontFamily:'inherit', fontSize:'0.9rem', outline:'none', background:'#fff' }}
              onFocus={e=>e.target.style.borderColor='var(--rose-400)'}
              onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ padding:'11px 14px', borderRadius:12, border:'2px solid var(--gray-200)',
              fontFamily:'inherit', fontSize:'0.9rem', outline:'none', background:'#fff', cursor:'pointer' }}>
            <option value="all">All</option>
            <option value="restricted">Restricted</option>
            <option value="unverified">Unverified</option>
          </select>
          <button onClick={async () => {
            try {
              const res = await api.get('/admin/export/users', { responseType:'blob' });
              const url = URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement('a'); a.href = url;
              a.download = `users_${Date.now()}.xlsx`;
              document.body.appendChild(a); a.click(); a.remove();
              URL.revokeObjectURL(url);
              toast.success('Users exported!');
            } catch { toast.error('Export failed'); }
          }}
            style={{ padding:'11px 16px', borderRadius:12, border:'2px solid var(--gray-200)',
              background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:'0.85rem', fontWeight:600,
              color:'var(--gray-700)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
            <Download size={16}/> Export
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div className="spinner" style={{ borderTopColor:'var(--rose-500)' }}/>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.04 }}
                style={{ background:'#fff', borderRadius:16, padding:'14px 16px',
                  boxShadow:'var(--shadow-sm)', border: u.isRestricted ? '2px solid #fecdd3' : '2px solid transparent' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <img src={avatar(u)} alt="" style={{ width:46, height:46, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <p style={{ fontWeight:700, color:'var(--gray-900)', fontFamily:'Outfit,sans-serif' }}>{u.name}</p>
                      {u.isRestricted && <span style={{ background:'#fee2e2', color:'#dc2626', fontSize:'0.68rem',
                        fontWeight:700, padding:'2px 8px', borderRadius:20 }}>RESTRICTED</span>}
                      {!u.isVerified && <span style={{ background:'#fef3c7', color:'#d97706', fontSize:'0.68rem',
                        fontWeight:700, padding:'2px 8px', borderRadius:20 }}>UNVERIFIED</span>}
                    </div>
                    <p style={{ color:'var(--gray-500)', fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</p>
                    <p style={{ color:'var(--gray-400)', fontSize:'0.75rem', marginTop:2 }}>
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={()=>setSelected(selected===u._id ? null : u._id)}
                    style={{ background:'var(--gray-100)', border:'none', borderRadius:10, padding:'8px',
                      cursor:'pointer', color:'var(--gray-500)', display:'flex', alignItems:'center' }}>
                    <ChevronDown size={16} style={{ transform: selected===u._id ? 'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }}/>
                  </button>
                </div>

                {selected===u._id && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    style={{ display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid var(--gray-100)' }}>
                    <button id={`admin-restrict-${u._id}`} onClick={()=>restrict(u._id, u.isRestricted)}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        padding:'9px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.82rem',
                        background: u.isRestricted ? '#ecfdf5' : '#fff1f2',
                        color: u.isRestricted ? '#10b981' : '#f43f5e' }}>
                      {u.isRestricted ? <><CheckCircle size={15}/> Unrestrict</> : <><Ban size={15}/> Restrict</>}
                    </button>
                    <button id={`admin-delete-${u._id}`} onClick={()=>deleteUser(u._id)}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        padding:'9px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.82rem',
                        background:'#fff1f2', color:'var(--rose-600)' }}>
                      <Trash2 size={15}/> Delete
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
            {filtered.length===0 && (
              <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--gray-400)' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                <p>No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
