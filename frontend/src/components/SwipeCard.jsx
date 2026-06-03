import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { MapPin, Info } from 'lucide-react';

export default function SwipeCard({ profile, onSwipe, isTop, style }) {
  const [showInfo, setShowInfo]   = useState(false);
  const [photoIdx, setPhotoIdx]   = useState(0);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate   = useTransform(x, [-200, 200], [-25, 25]);
  const likeOp   = useTransform(x, [20, 100],  [0, 1]);
  const nopeOp   = useTransform(x, [-100, -20], [1, 0]);
  const superOp  = useTransform(y, [-100, -30], [1, 0]);

  if (!profile) return null;

  const photos = profile.photos?.length
    ? profile.photos
    : ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80'];

  const handleDragEnd = async (_, info) => {
    const { offset, velocity } = info;
    const swipeX = Math.abs(offset.x) > 120 || Math.abs(velocity.x) > 500;
    const swipeU = offset.y < -120 || velocity.y < -500;

    if (swipeU && isTop) {
      await controls.start({ y: -window.innerHeight, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('superlike');
    } else if (swipeX && offset.x > 0 && isTop) {
      await controls.start({ x: window.innerWidth + 200, rotate: 30, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('like');
    } else if (swipeX && offset.x < 0 && isTop) {
      await controls.start({ x: -window.innerWidth - 200, rotate: -30, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('pass');
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }
  };

  const age = profile.dob
    ? Math.floor((Date.now() - new Date(profile.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : profile.age || '?';

  return (
    <motion.div
      className="swipe-card"
      style={{ ...style, x, y, rotate, cursor: isTop ? 'grab' : 'default' }}
      animate={controls}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.04, cursor: 'grabbing' }}
    >
      {/* Photo */}
      <img src={photos[photoIdx]?.url || photos[photoIdx]} alt={profile.name} className="swipe-card-img" />
      <div className="swipe-card-overlay" />

      {/* Photo dots */}
      {photos.length > 1 && (
        <div style={{ position:'absolute', top:12, left:0, right:0, display:'flex', gap:4, justifyContent:'center', padding:'0 12px' }}>
          {photos.map((_, i) => (
            <button key={i} onClick={()=>setPhotoIdx(i)}
              style={{ flex:1, height:3, borderRadius:2, background: i===photoIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                border:'none', cursor:'pointer', transition:'all 0.2s' }}/>
          ))}
        </div>
      )}

      {/* Photo nav tap zones */}
      <div style={{ position:'absolute', top:0, left:0, width:'40%', height:'100%', zIndex:5 }}
        onClick={()=>setPhotoIdx(p=>Math.max(0,p-1))}/>
      <div style={{ position:'absolute', top:0, right:0, width:'40%', height:'100%', zIndex:5 }}
        onClick={()=>setPhotoIdx(p=>Math.min(photos.length-1,p+1))}/>

      {/* Swipe indicators */}
      <motion.div className="swipe-indicator like" style={{ opacity: likeOp }}>LIKE 💚</motion.div>
      <motion.div className="swipe-indicator nope"  style={{ opacity: useTransform(x, [-20,-100],[0,1]) }}>NOPE ❌</motion.div>
      <motion.div className="swipe-indicator super" style={{ opacity: superOp }}>SUPER ⭐</motion.div>

      {/* Info panel */}
      <div className="swipe-card-info">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'Outfit,sans-serif', marginBottom:2 }}>
              {profile.name}, {age}
            </h2>
            {profile.location?.city && (
              <p style={{ display:'flex', alignItems:'center', gap:4, opacity:0.8, fontSize:'0.85rem' }}>
                <MapPin size={14}/>{profile.location.city}
              </p>
            )}
          </div>
          <button onClick={()=>setShowInfo(p=>!p)}
            style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%',
              width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', cursor:'pointer', backdropFilter:'blur(8px)' }}>
            <Info size={18}/>
          </button>
        </div>

        {showInfo && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{ marginTop:12 }}>
            {profile.bio && <p style={{ fontSize:'0.88rem', opacity:0.85, marginBottom:8, lineHeight:1.5 }}>{profile.bio}</p>}
            {profile.interests?.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {profile.interests.slice(0,5).map(it=>(
                  <span key={it} style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)',
                    borderRadius:20, padding:'3px 10px', fontSize:'0.75rem', fontWeight:500 }}>{it}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
