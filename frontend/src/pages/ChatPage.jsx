import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { encryptMessage, decryptMessage } from '../utils/e2ee';

async function tryDecrypt(content, encrypted) {
  if (!encrypted || !content) return content || '';
  if (content.startsWith('[')) return content;
  try {
    return await decryptMessage(content);
  } catch {
    return '[encrypted]';
  }
}

function isBase64(str) {
  if (!str || str.length < 20) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}

function MessageBubble({ msg, isOwn }) {
  const [decoded, setDecoded] = useState('');
  useEffect(() => { tryDecrypt(msg.content, msg.encrypted).then(setDecoded); }, [msg.content, msg.encrypted]);
  return (
    <div style={{ display:'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom:8 }}>
      <div style={{
        maxWidth:'70%', padding:'8px 14px', borderRadius:16,
        background: isOwn ? '#007bff' : '#e9ecef',
        color: isOwn ? '#fff' : '#000',
        fontSize:15, lineHeight:1.4, wordBreak:'break-word'
      }}>
        {decoded}
        {msg.isAiReply && <span style={{ fontSize:11, opacity:0.6, display:'block', marginTop:2 }}>AI</span>}
      </div>
    </div>
  );
}

function MatchItem({ match, user, onClick }) {
  const [preview, setPreview] = useState('');
  const other = match.users?.find(u => String(u._id) !== String(user?._id));
  useEffect(() => {
    const c = match.lastMessage?.content || '';
    if (match.lastMessage && isBase64(c) && c.length > 30) {
      tryDecrypt(c, true).then(setPreview);
    } else {
      setPreview(c);
    }
  }, [match.lastMessage]);
  return (
    <div onClick={onClick}
      style={{ padding:16, margin:8, background:'#fff', border:'1px solid #ddd', borderRadius:12, cursor:'pointer' }}>
      <b>{other?.name || 'User'}</b>
      <p style={{ color:'#666', fontSize:14, marginTop:4 }}>{preview || (match.lastMessage ? '📨 Encrypted' : '')}</p>
    </div>
  );
}

export default function ChatPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recipientKey, setRecipientKey] = useState(null);
  const [ready, setReady] = useState(false);
  const bottomRef = useRef(null);

  // Fetch all matches
  useEffect(() => {
    api.get('/matches').then(r => {
      setMatches(r.data.matches || []);
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  // Fetch recipient's public key for a match
  useEffect(() => {
    if (!matchId || !matches.length) return;
    const m = matches.find(x => x._id === matchId);
    if (!m) return;
    const other = m.users?.find(u => String(u._id) !== String(user?._id));
    if (!other) return;
    api.get(`/users/public-key/${other._id}`).then(r => {
      const jwk = typeof r.data.publicKey === 'string' ? JSON.parse(r.data.publicKey) : r.data.publicKey;
      setRecipientKey(jwk);
    }).catch(() => setRecipientKey(null));
  }, [matchId, matches, user]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!matchId) return;
    api.get(`/chat/${matchId}`).then(r => setMessages(r.data.messages || [])).catch(() => {});
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Send message
  const sendMsg = useCallback(async () => {
    if (!text.trim()) return;
    let payload = text.trim();
    if (recipientKey) {
      payload = await encryptMessage(text.trim(), recipientKey);
    }
    try {
      const { data } = await api.post(`/chat/${matchId}`, { content: payload, messageType:'text' });
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setText('');
      }
    } catch (e) {
      console.error('send error', e);
    }
  }, [text, recipientKey, matchId]);

  const matched = matches.find(m => m._id === matchId);
  const other = matched?.users?.find(u => String(u._id) !== String(user?._id));

  // ── Match list (no matchId) ──
  if (!matchId) {
    return (
      <div style={{ padding:20, fontFamily:'Arial' }}>
        <h1>Messages</h1>
        {matches.map(m => (
          <MatchItem key={m._id} match={m} user={user} onClick={() => navigate('/chat/' + m._id)} />
        ))}
        {!ready && <p>Loading...</p>}
        {ready && matches.length === 0 && <p>No matches yet</p>}
      </div>
    );
  }

  // ── Active chat ──
  return (
    <div style={{ fontFamily:'Arial', display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
      <div style={{ padding:'12px 20px', borderBottom:'1px solid #ddd', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate('/chat')} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20 }}>←</button>
        <b style={{ flex:1 }}>{other?.name || 'Chat'}</b>
        <button onClick={() => navigate('/recommendations/' + matchId)}
          style={{ border:'none', borderRadius:8, padding:'6px 12px', background:'var(--gradient-primary)',
            color:'#fff', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <Sparkles size={14}/> Dates
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {messages.map(msg => (
          <MessageBubble key={msg._id} msg={msg} isOwn={String(msg.sender?._id || msg.sender) === String(user?._id)} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:12, borderTop:'1px solid #ddd', display:'flex', gap:8 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder={recipientKey ? '🔒 Type a message...' : 'Type a message...'}
          style={{ flex:1, borderRadius:20, border:'1px solid #ccc', padding:'8px 16px', fontSize:15, outline:'none' }}
        />
        <button onClick={sendMsg} style={{ borderRadius:20, border:'none', background:'#007bff', color:'#fff', padding:'8px 20px', cursor:'pointer' }}>Send</button>
      </div>
    </div>
  );
}
