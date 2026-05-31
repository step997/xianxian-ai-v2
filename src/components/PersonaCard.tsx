import type { Persona } from '../types/shared-types';
import { usePersonaStore } from '../stores/personaStore';
import { useChatStore } from '../stores/chatStore';
import { PetAnimator } from './PetAnimator';

interface PersonaCardProps { persona: Persona; }

export function PersonaCard({ persona }: PersonaCardProps) {
  const currentPersonaId = usePersonaStore((s) => s.currentPersonaId);
  const setCurrentPersonaId = usePersonaStore((s) => s.setCurrentPersonaId);
  const saveChatCache = useChatStore((s) => s.saveChatCache);
  const loadPersonaHistory = useChatStore((s) => s.loadPersonaHistory);
  const isActive = currentPersonaId === persona.id;

  const handleSelect = () => {
    if (isActive) {
      PetAnimator.play('happy');
      return;
    }
    // Save current persona chat cache before switching
    saveChatCache(currentPersonaId);
    setCurrentPersonaId(persona.id);
    // Load new persona's history
    loadPersonaHistory(persona.id);
    PetAnimator.play('switch');
  };

  return (
    <button onClick={handleSelect} style={{
      display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: 20,
      borderRadius: 16, textAlign: 'left', cursor: 'pointer',
      background: isActive ? `linear-gradient(135deg, ${persona.glow}, transparent)` : 'var(--card)',
      border: isActive ? `2px solid ${persona.color}` : '2px solid var(--border)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, boxShadow: isActive ? `0 0 16px ${persona.glow}` : 'none' }}>
        {persona.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: isActive ? persona.color : 'var(--text)' }}>
          {persona.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{persona.tag}</div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>
          "{persona.quote}"
        </div>
      </div>
      {isActive && <div style={{ width: 28, height: 28, borderRadius: '50%', background: persona.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', flexShrink: 0 }}>✓</div>}
    </button>
  );
}
