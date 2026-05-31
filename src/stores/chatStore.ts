import { create } from 'zustand';
import type { ChatMessage } from '../types/shared-types';
import * as api from '../services/api';
import {
  getChatCacheHtml, setChatCacheHtml, removeChatCacheHtml,
  clearAllChatCaches, getToken, setCacheOwner, getCacheOwner,
} from '../utils/storage';
import { getUserIdFromToken } from '../utils/jwt';

let msgCounter = Date.now();
function nextId(): string {
  return `msg_${++msgCounter}`;
}

// In-memory JSON cache (mirrors localStorage for speed)
const memoryCache: Record<string, ChatMessage[]> = {};

/** Safe JSON serialization of chat messages for localStorage caching */
function serializeMessages(msgs: ChatMessage[]): string {
  return JSON.stringify(msgs);
}

/** Safe JSON deserialization of chat messages from localStorage */
function deserializeMessages(json: string): ChatMessage[] | null {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (m): m is ChatMessage =>
        typeof m === 'object' && m !== null &&
        typeof m.id === 'string' &&
        (m.role === 'user' || m.role === 'assistant' || m.role === 'system') &&
        typeof m.content === 'string'
    );
  } catch {
    return null;
  }
}

/** 获取当前JWT中的用户ID字符串，用于缓存归属校验 */
function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  const uid = getUserIdFromToken(token);
  return uid !== null ? String(uid) : null;
}

/** 校验缓存是否属于当前用户。不是则清空所有缓存并返回false。 */
function validateCacheOwnership(): boolean {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return false;

  const cacheOwner = getCacheOwner();
  if (cacheOwner && cacheOwner !== currentUserId) {
    // 缓存属于其他用户！立即清空
    clearAllChatCaches();
    for (const key of Object.keys(memoryCache)) delete memoryCache[key];
    return false;
  }
  // 设置或更新缓存归属
  setCacheOwner(currentUserId);
  return true;
}

interface ChatState {
  messages: ChatMessage[];
  isWaiting: boolean;
  error: string | null;
  showScrollButton: boolean;
  statusText: string;

  getMessages: () => ChatMessage[];
  sendMessage: (text: string, personaId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadPersonaHistory: (personaId: string) => Promise<void>;
  clearHistory: (personaId: string) => Promise<void>;
  saveChatCache: (personaId: string) => void;
  restoreChatCache: (personaId: string) => void;
  setShowScrollButton: (v: boolean) => void;
  setStatusText: (text: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isWaiting: false,
  error: null,
  showScrollButton: false,
  statusText: '',

  getMessages: () => get().messages,

  sendMessage: async (text: string, personaId: string) => {
    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      personaId,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isWaiting: true, error: null }));

    try {
      const response = await api.sendChatMessage(text, personaId);
      const aiMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: response.reply || '(对方没有说话…)',
        personaId: response.persona || personaId,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, aiMsg], isWaiting: false }));
      get().saveChatCache(personaId);
    } catch (err: unknown) {
      set({ isWaiting: false });
      let errorContent: string;

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = axiosErr.response?.status;
        if (status === 401) {
          errorContent = '登录已过期，请重新登录';
        } else if (status === 429) {
          errorContent = '你说得太快啦，让我歇一歇…（请求太频繁，请稍后再试）';
        } else {
          errorContent = axiosErr.response?.data?.detail || `服务器出小差了（${status}），请稍后重试`;
        }
      } else {
        errorContent = '连接不上后端服务器，请确认后端已启动且地址正确';
      }

      const sysMsg: ChatMessage = {
        id: nextId(),
        role: 'system',
        content: errorContent,
        personaId,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, sysMsg] }));
      get().saveChatCache(personaId);
    }
  },

  loadHistory: async () => {
    const token = getToken();
    if (!token) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // 跨用户缓存清理：校验缓存归属
    const cacheOwner = getCacheOwner();
    if (cacheOwner && cacheOwner !== currentUserId) {
      clearAllChatCaches();
      for (const key of Object.keys(memoryCache)) delete memoryCache[key];
    }
    // 更新归属标记
    setCacheOwner(currentUserId);

    try {
      const response = await api.getChatHistory();
      if (!response.history || response.history.length === 0) {
        return;
      }

      // Build per-persona message caches from history (JSON-based, no innerHTML)
      const personaMessages: Record<string, ChatMessage[]> = {};
      let counter = Date.now();
      for (const item of response.history) {
        const pid = item.persona || 'cat_warm';
        if (!personaMessages[pid]) personaMessages[pid] = [];
        personaMessages[pid].push(
          { id: `hist_${++counter}`, role: 'user', content: item.message, personaId: pid, timestamp: item.created_at || new Date().toISOString() },
          { id: `hist_${++counter}`, role: 'assistant', content: item.reply, personaId: pid, timestamp: item.created_at || new Date().toISOString() },
        );
      }

      for (const [pid, msgs] of Object.entries(personaMessages)) {
        memoryCache[pid] = msgs;
        setChatCacheHtml(pid, serializeMessages(msgs));
      }
    } catch {
      // API 失败：清空所有缓存（因为跨用户清理可能已清空，确保不会残留旧数据）
      clearAllChatCaches();
      for (const key of Object.keys(memoryCache)) delete memoryCache[key];
    }
  },

  loadPersonaHistory: async (personaId: string) => {
    // 【关键安全修复】加载前先校验缓存归属
    validateCacheOwnership();

    try {
      const response = await api.getChatHistory(personaId);
      if (!response.history || response.history.length === 0) {
        removeChatCacheHtml(personaId);
        delete memoryCache[personaId];
        get().restoreChatCache(personaId);
        return;
      }

      const msgs: ChatMessage[] = [];
      let counter = Date.now();
      for (const item of response.history) {
        msgs.push(
          { id: `hist_${++counter}`, role: 'user', content: item.message, personaId, timestamp: item.created_at || new Date().toISOString() },
          { id: `hist_${++counter}`, role: 'assistant', content: item.reply, personaId, timestamp: item.created_at || new Date().toISOString() },
        );
      }
      memoryCache[personaId] = msgs;
      setChatCacheHtml(personaId, serializeMessages(msgs));
      get().restoreChatCache(personaId);
    } catch {
      // 【关键安全修复】API失败时清空该人格缓存，避免残留其他用户数据
      removeChatCacheHtml(personaId);
      delete memoryCache[personaId];
      get().restoreChatCache(personaId);
    }
  },

  clearHistory: async (personaId: string) => {
    try { await api.deleteHistory(personaId); } catch {}
    removeChatCacheHtml(personaId);
    delete memoryCache[personaId];
    set({ messages: [] });
  },

  saveChatCache: (personaId: string) => {
    const msgs = get().messages;
    memoryCache[personaId] = msgs;
    setChatCacheHtml(personaId, serializeMessages(msgs));
  },

  restoreChatCache: (personaId: string) => {
    // 【关键安全修复】先校验缓存归属，防止加载其他用户数据
    if (!validateCacheOwnership()) {
      // 归属校验失败（缓存属于其他用户或未登录），清空消息
      set({ messages: [] });
      return;
    }

    let msgs = memoryCache[personaId];
    if (!msgs) {
      const raw = getChatCacheHtml(personaId);
      if (raw) {
        const parsed = deserializeMessages(raw);
        if (parsed) {
          memoryCache[personaId] = parsed;
          msgs = parsed;
        } else {
          // 解析失败，清除无效缓存
          removeChatCacheHtml(personaId);
        }
      }
    }
    set({ messages: msgs && msgs.length > 0 ? msgs : [] });
  },

  setShowScrollButton: (v: boolean) => set({ showScrollButton: v }),
  setStatusText: (text: string) => set({ statusText: text }),
}));
