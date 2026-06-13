import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { io as socketIO } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { encryptMessage, decryptMessage } from '../utils/e2ee';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

async function tryDecrypt(content) {
  if (!content) return '';
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
  useEffect(() => {
    if (msg.encrypted) {
      tryDecrypt(msg.content).then(setDecoded);
    } else {
      setDecoded(msg.content || '');
    }
  }, [msg.content, msg.encrypted]);
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

function MatchItem({ match, user, onClick, getPlain }) {
  const [preview, setPreview] = useState('');
  const other = match.users?.find(u => String(u._id) !== String(user?._id));
  useEffect(() => {
    const c = match.lastMessage?.content || '';
    const isOwn = String(match.lastMessage?.sentBy || '') === String(user?._id || '');
    if (match.lastMessage?.encrypted && isOwn) {
      // Own message — use cached plaintext
      const plain = getPlain?.(c);
      setPreview(plain ? `You: ${plain}` : 'You: ✅ Sent');
    } else if (match.lastMessage?.encrypted && isBase64(c) && c.length > 30) {
      tryDecrypt(c).then(setPreview);
    } else {
      setPreview(c);
    }
  }, [match.lastMessage, user]);
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
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const pendingRef = useRef(new Map()); // encryptedContent -> plaintext
  const userIdRef = useRef(user?._id);
  userIdRef.current = user?._id;

  // Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('romyntra_token');
    if (!token) return;
    const socket = socketIO(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('connect', () => {
      if (matchId) {
        socket.emit('join_chat', { matchId });
      }
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        // Skip own messages (already added as plaintext temp)
        if (String(msg.sender?._id || msg.sender) === String(userIdRef.current)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('error', (err) => {
      toast.error(err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  // Re-join chat room when matchId changes
  useEffect(() => {
    if (socketRef.current?.connected && matchId) {
      socketRef.current.emit('join_chat', { matchId });
    }
  }, [matchId]);

  // Fetch all matches
  useEffect(() => {
    api.get('/matches').then(r => {
      setMatches(r.data.matches || []);
      setReady(true);
    }).catch(err => {
      setError(err.message);
      setReady(true);
    });
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
    if (!matchId || !user) return;
    api.get(`/chat/${matchId}`).then(r => {
      const msgs = (r.data.messages || []).map(msg => {
        const isOwn = String(msg.sender?._id || msg.sender) === String(user._id);
        if (isOwn && msg.encrypted) {
          const plain = pendingRef.current.get(msg.content);
          if (plain) return { ...msg, content: plain, encrypted: false };
        }
        return msg;
      });
      setMessages(msgs);
    }).catch(err => {
      toast.error('Failed to load messages');
    });
  }, [matchId, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Send message via Socket.IO
  const sendMsg = useCallback(async () => {
    if (!text.trim()) return;
    const plaintext = text.trim();
    let payload = plaintext;
    const isEncrypted = !!recipientKey;
    if (recipientKey) {
      payload = await encryptMessage(plaintext, recipientKey);
      pendingRef.current.set(payload, plaintext);
    }
    // Add plaintext message immediately so sender sees it
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      content: plaintext,
      encrypted: false,
      sender: { _id: user._id, name: user.name, photos: user.photos || [] },
      createdAt: new Date().toISOString(),
      messageType: 'text',
      isAiReply: false,
    };
    setMessages(prev => [...prev, tempMsg]);
    setText('');

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('send_message', { matchId, content: payload, messageType: 'text', encrypted: isEncrypted });
    } else {
      try {
        await api.post(`/chat/${matchId}`, { content: payload, messageType: 'text', encrypted: isEncrypted });
      } catch (e) {
        setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
        toast.error('Failed to send message');
      }
    }
  }, [text, recipientKey, matchId, user]);

  const matched = matches.find(m => m._id === matchId);
  const other = matched?.users?.find(u => String(u._id) !== String(user?._id));

  if (error) {
    return (
      <div style={{ padding:20, fontFamily:'Arial', textAlign:'center' }}>
        <p style={{ color:'red' }}>Error: {error}</p>
        <button onClick={() => navigate('/matches')} style={{ marginTop:12, padding:'8px 16px' }}>Back to Matches</button>
      </div>
    );
  }

  // Match list (no matchId)
  if (!matchId) {
    return (
      <div style={{ padding:20, fontFamily:'Arial' }}>
        <h1>Messages</h1>
          {matches.map(m => (
            <MatchItem key={m._id} match={m} user={user}
              getPlain={(c) => pendingRef.current.get(c)}
              onClick={() => navigate('/chat/' + m._id)} />
          ))}
        {!ready && <p>Loading...</p>}
        {ready && matches.length === 0 && <p>No matches yet</p>}
      </div>
    );
  }

  // Active chat
  return (
    <div style={{ fontFamily:'Arial', display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
      <div style={{ padding:'12px 20px', borderBottom:'1px solid #ddd', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate('/chat')} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20 }}>
          <ArrowLeft size={20}/>
        </button>
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