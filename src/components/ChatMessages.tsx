import { useEffect, useRef, useCallback, Fragment } from 'react';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore, getPersonaById } from '../stores/personaStore';
import { useToast } from '../components/Toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../hooks/useAuth';
import type { ChatMessage } from '../types/shared-types';

// ── Helpers ──────────────────────────────────────────────

/** 5 minutes in milliseconds — threshold for showing a time divider */
const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000;

function formatTime(iso: string): string {
  // 兼容 SQLite 无时区标识的 UTC 时间戳（后端已修，此处防御）
  const normalized = iso.endsWith('Z') || iso.includes('+') || iso.includes('GMT') ? iso : iso + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    const fallback = new Date(iso);  // 尝试原生解析
    if (isNaN(fallback.getTime())) return '';
    return `${String(fallback.getHours()).padStart(2, '0')}:${String(fallback.getMinutes()).padStart(2, '0')}`;
  }
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function shouldShowDivider(prev: ChatMessage, curr: ChatMessage): boolean {
  if (!prev.timestamp || !curr.timestamp) return false;
  const diff = Math.abs(new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime());
  return diff > TIME_DIVIDER_GAP_MS;
}

// ── Main component ───────────────────────────────────────

export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const isWaiting = useChatStore((s) => s.isWaiting);
  const showScrollButton = useChatStore((s) => s.showScrollButton);
  const setShowScrollButton = useChatStore((s) => s.setShowScrollButton);
  const persona = usePersonaStore((s) => s.getCurrentPersona());
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const checkScrollButton = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distToBottom > 200);
  }, [setShowScrollButton]);

  // Auto-scroll when messages change or when waiting state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isWaiting) scrollToBottom();
  }, [isWaiting, scrollToBottom]);

  // Scroll event for the scroll-to-bottom button
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => checkScrollButton();
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [checkScrollButton]);

  const { showToast } = useToast();

  const handleCopy = useCallback((text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制');
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('已复制');
    }
  }, [showToast]);

  // ── Empty state ────────────────────────────────────────
  if (messages.length === 0 && !isWaiting) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-dim)', fontSize: 16,
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{persona?.emoji || '🐾'}</div>
          <div>来和我说句话吧~</div>
        </div>
      </div>
    );
  }

  const avatarSize = isMobile ? 28 : 32;

  // ── Render ─────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{
      flex: 1, overflow: 'auto', padding: '12px 16px', position: 'relative',
    }}>
      {messages.map((msg, i) => (
        <Fragment key={msg.id}>
          {/* Time divider — shown when gap > 5 min */}
          {i > 0 && shouldShowDivider(messages[i - 1], msg) && (
            <div style={{
              display: 'flex', justifyContent: 'center',
              margin: '20px 0 16px',
            }}>
              <span style={{
                fontSize: 12,
                color: 'var(--text-dim)',
                background: 'var(--bg)',
                padding: '3px 10px',
                borderRadius: 4,
                lineHeight: 1.5,
              }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          )}

          <ChatBubble
            message={msg}
            onCopy={handleCopy}
            isMobile={isMobile}
            avatarSize={avatarSize}
          />
        </Fragment>
      ))}

      {/* Typing indicator — AI bubble style */}
      {isWaiting && persona && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 10,
          marginBottom: 16,
        }}>
          <div style={{
            width: avatarSize, height: avatarSize, borderRadius: '50%',
            background: persona.color,
            border: `2px solid ${persona.color}`,
            fontSize: isMobile ? 14 : 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#fff',
          }}>
            {persona.emoji}
          </div>
          <div>
            <div style={{ fontSize: 11, color: persona.color, marginBottom: 4, fontWeight: 600, paddingLeft: 4 }}>
              {persona.name}
            </div>
            <div style={{
              background: 'var(--bubble-ai)', borderRadius: '16px 16px 16px 4px',
              padding: '12px 16px', boxShadow: 'var(--shadow-sm)',
              display: 'flex', gap: 4, alignItems: 'center', height: 40,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-dim)', animation: 'dotBounce 1.4s infinite' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-dim)', animation: 'dotBounce 1.4s infinite 0.2s' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-dim)', animation: 'dotBounce 1.4s infinite 0.4s' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Scroll-to-bottom button */}
      {showScrollButton && (
        <button onClick={scrollToBottom} style={{
          position: 'absolute', bottom: 16, right: 24,
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow)', zIndex: 50,
        }}>
          ↓
        </button>
      )}
    </div>
  );
}

// ── ChatBubble ──────────────────────────────────────────

interface ChatBubbleProps {
  message: ChatMessage;
  onCopy: (t: string) => void;
  isMobile: boolean;
  avatarSize: number;
}

function ChatBubble({ message, onCopy, isMobile, avatarSize }: ChatBubbleProps) {
  const msgPersona = getPersonaById(message.personaId);
  const { user } = useAuth();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // ── System message: centered error text ────────────────
  if (isSystem) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        margin: '12px 0',
      }}>
        <span style={{
          fontSize: 13,
          color: 'var(--text-dim)',
          background: 'var(--bg)',
          padding: '6px 12px',
          borderRadius: 8,
          maxWidth: '80%',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {message.content}
        </span>
      </div>
    );
  }

  const personaColor = msgPersona.color;
  const bubbleMaxWidth = isMobile ? '75%' : '60%';

  // ── User / AI message ──────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 10,
      marginBottom: 16,
    }}>
      {/* ── AI avatar: LEFT side ── */}
      {!isUser && (
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%',
          background: personaColor,
          border: `2px solid ${personaColor}`,
          fontSize: isMobile ? 14 : 16,
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {msgPersona.emoji}
        </div>
      )}

      {/* ── Bubble column ── */}
      <div style={{
        maxWidth: bubbleMaxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* AI name label */}
        {!isUser && (
          <div style={{
            fontSize: 11, color: personaColor, marginBottom: 4,
            fontWeight: 600, paddingLeft: 4,
          }}>
            {msgPersona.name}
          </div>
        )}

        {/* Bubble */}
        <div
          onContextMenu={(e) => { e.preventDefault(); onCopy(message.content); }}
          style={{
            padding: '10px 14px',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isUser ? 'var(--bubble-user)' : 'var(--bubble-ai)',
            color: isUser ? 'var(--bubble-user-text)' : 'var(--text)',
            fontSize: isMobile ? 16 : 15,
            lineHeight: 1.65,
            wordBreak: 'break-word',
            boxShadow: 'var(--shadow-sm)',
            userSelect: 'text',
          }}
        >
          {message.content}
        </div>
      </div>

      {/* ── User avatar: RIGHT side ── */}
      {isUser && (
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {user?.username?.charAt(0)?.toUpperCase() || '我'}
        </div>
      )}
    </div>
  );
}
