import { useState, useEffect, useRef } from 'react';
import { usePersonaStore } from '../stores/personaStore';
import { PetAnimator, type PetAnimation } from './PetAnimator';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function PetAvatar() {
  const persona = usePersonaStore((s) => s.getCurrentPersona());
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [animation, setAnimation] = useState<PetAnimation>('idle');
  const [switching, setSwitching] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const wrapperSize = isDesktop ? 120 : 100;
  const faceSize = isDesktop ? 80 : 68;
  const emojiSize = isDesktop ? 44 : 36;
  const labelSize = isDesktop ? 16 : 14;

  useEffect(() => {
    setSwitching(true);
    const timer = setTimeout(() => setSwitching(false), 400);
    return () => clearTimeout(timer);
  }, [persona?.emoji]);

  useEffect(() => {
    const unsubs = [
      PetAnimator.on('happy', () => setAnimation('happy')),
      PetAnimator.on('shake', () => setAnimation('shake')),
      PetAnimator.on('thinking', () => setAnimation('thinking')),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    if (animation === 'idle') return;
    const timer = setTimeout(() => {
      setAnimation('idle');
    }, animation === 'thinking' ? 2000 : 600);
    return () => clearTimeout(timer);
  }, [animation]);

  const handleClick = () => {
    PetAnimator.play('shake');
    if (avatarRef.current && persona) {
      const emojis = ['💕','✨','🌟','💫','🎉'];
      for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        span.textContent = emojis[i];
        span.style.cssText = `position:absolute;font-size:20px;pointer-events:none;z-index:999;left:${30+Math.random()*40}px;top:${20+Math.random()*40}px;--fx:${(Math.random()-0.5)*80}px;--fy:-${40+Math.random()*40}px;animation:emojiFloat 0.8s ease-out forwards;`;
        avatarRef.current.appendChild(span);
        setTimeout(() => span.remove(), 800);
      }
    }
  };

  if (!persona) return null;

  const animClass =
    switching ? 'animate-switch' :
    animation === 'happy' ? 'animate-happy' :
    animation === 'shake' ? 'animate-shake' :
    animation === 'thinking' ? 'animate-shake' :
    'animate-float';

  // All layers use the SAME centering: top 50% + left 50% + translate(-50%, -50%)
  const center: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div ref={avatarRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
      <div style={{ position: 'relative', width: wrapperSize, height: wrapperSize }} onClick={handleClick}>
        {/* Outer accent ring */}
        <div style={{
          ...center,
          width: wrapperSize,
          height: wrapperSize,
          borderRadius: '50%',
          border: `2px solid ${persona.color}`,
          zIndex: 1,
        }} />

        {/* Layer 3: Face background — colored circle, same center */}
        <div style={{
          ...center,
          width: faceSize,
          height: faceSize,
          borderRadius: '50%',
          background: persona.color,
          zIndex: 2,
        }} />

        {/* Layer 4: Emoji — on top of face, same center */}
        <div className={animClass} style={{
          ...center,
          width: faceSize,
          height: faceSize,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: emojiSize,
          cursor: 'pointer',
          userSelect: 'none',
          zIndex: 3,
        }}>
          {persona.emoji}
        </div>
      </div>

      <span style={{
        fontSize: labelSize,
        letterSpacing: isDesktop ? 3 : 2,
        color: 'var(--text-dim)',
        fontFamily: "'ZCOOL KuaiLe', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}>
        {persona.name}
      </span>
    </div>
  );
}
