import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Heart, MessageCircle, User } from 'lucide-react';

const ITEMS = [
  { path:'/discover', icon:Compass, label:'Discover' },
  { path:'/matches',  icon:Heart,   label:'Matches'  },
  { path:'/chat',     icon:MessageCircle, label:'Chat' },
  { path:'/profile',  icon:User,    label:'Profile'  },
];

export default function Navbar({ matchCount=0, messageCount=0 }) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const badges = { '/matches': matchCount, '/chat': messageCount };

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ path, icon: Icon, label }) => {
        const active  = pathname.startsWith(path);
        const badge   = badges[path] || 0;
        return (
          <button
            key={path}
            id={`nav-${label.toLowerCase()}`}
            className={`nav-item${active?' active':''}`}
            onClick={() => navigate(path)}
          >
            <div style={{ position:'relative' }}>
              {active ? (
                <motion.div layoutId="nav-indicator"
                  style={{ position:'absolute', inset:-8, borderRadius:12,
                    background:'linear-gradient(135deg,rgba(244,63,94,0.15),rgba(168,85,247,0.15))' }}/>
              ) : null}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} style={{ position:'relative', zIndex:1 }}/>
              {badge > 0 && (
                <span className="nav-badge">{badge > 9 ? '9+' : badge}</span>
              )}
            </div>
            <span style={{ fontSize:'0.68rem', fontWeight: active ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
