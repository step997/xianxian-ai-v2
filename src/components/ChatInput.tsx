import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';

const COMMON_EMOJIS = ['😊','😂','❤️','👍','🙏','😍','🤔','😢','🎉','🔥','😭','💪','✨','🥺','😎','🌹','🤣','😅','💕','😁'];

export function ChatInput() {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const personaId = usePersonaStore((s) => s.currentPersonaId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isWaiting = useChatStore((s) => s.isWaiting);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // VisualViewport for keyboard-aware positioning
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const diff = window.innerHeight - vv.height;
      setKbHeight(diff > 100 ? diff : 0);
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  // Click outside to close emoji picker
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart || text.length;
    const end = input.selectionEnd || text.length;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setShowEmoji(false);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isWaiting) return;
    setText('');
    await sendMessage(trimmed, personaId);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      flexShrink: 0,
      padding: '8px 12px 12px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'relative',
      paddingBottom: kbHeight > 0 ? `calc(12px + ${kbHeight}px)` : 12,
      transition: 'padding-bottom 0.15s ease',
    }}>
      {/* Emoji Picker */}
      {showEmoji && (
        <div ref={pickerRef} style={{
          position: 'absolute', bottom: 68, left: 16,
          background: 'var(--surface)', borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4, padding: 8, zIndex: 200,
        }}>
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              style={{ fontSize: 24, padding: 8, minWidth: 44, minHeight: 44, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        maxWidth: 700, margin: '0 auto', position: 'relative',
      }}>
        {/* Emoji Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowEmoji(!showEmoji); }}
          style={{
            minWidth: 44, minHeight: 44, borderRadius: 10,
            background: 'transparent', border: 'none', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, opacity: 0.6,
          }}
        >
          😊
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={isWaiting}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--bg-soft)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: 16,
            lineHeight: 1.5,
            height: 44,
            outline: 'none',
          }}
        />

        <button
          onClick={handleSend}
          disabled={isWaiting || !text.trim()}
          style={{
            minWidth: 44, minHeight: 44, borderRadius: 12,
            background: isWaiting || !text.trim() ? 'var(--card)' : 'var(--accent)',
            color: '#fff', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: 'none', cursor: isWaiting ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
