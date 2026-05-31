import { useEffect } from 'react';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { PetAvatar } from '../components/PetAvatar';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';

export function ChatPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const loadHistory = useChatStore((s) => s.loadHistory);
  const loadPersonaHistory = useChatStore((s) => s.loadPersonaHistory);
  const personaId = usePersonaStore((s) => s.currentPersonaId);
  const persona = usePersonaStore((s) => s.getCurrentPersona());
  const error = useChatStore((s) => s.error);
  const statusText = useChatStore((s) => s.statusText);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { loadPersonaHistory(personaId); }, [personaId, loadPersonaHistory]);

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar — only persona name + pet on mobile */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        {isMobile && <PetAvatar />}
        {persona && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: persona.color }}>
              {persona.name}
            </div>
            <div style={{ fontSize: 13, color: error ? '#e74c3c' : 'var(--text-dim)' }}>
              {error || statusText || persona.tag}
            </div>
          </div>
        )}
      </div>

      {/* Messages area — fills all remaining space */}
      <ChatMessages />

      {/* Input area — always at bottom, never shrinks */}
      <ChatInput />
    </div>
  );
}
