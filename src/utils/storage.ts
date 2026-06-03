export const STORAGE_KEYS = {
  TOKEN: 'xianxian_token',
  THEME: 'xianxian_theme',
  PERSONA: 'xianxian_persona',
  SERVER: 'xianxian_server',
  CHAT_CACHE_PREFIX: 'xianxian_chatcache_',
  CACHE_OWNER: 'xianxian_cache_owner',   // 缓存归属用户ID，用于跨用户防泄露
  LAST_USER_ID: 'xianxian_last_user_id', // 上次登录用户ID，用于切换检测
} as const;

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

export function getTheme(): string | null {
  return localStorage.getItem(STORAGE_KEYS.THEME);
}

export function setTheme(theme: string): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function getPersona(): string | null {
  return localStorage.getItem(STORAGE_KEYS.PERSONA);
}

export function setPersona(personaId: string): void {
  localStorage.setItem(STORAGE_KEYS.PERSONA, personaId);
}

export function getServerUrl(): string {
  return (localStorage.getItem(STORAGE_KEYS.SERVER) || 'https://xianxian-ai.cn').replace(/\/+$/, '');
}

export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.SERVER, url);
}

export function getChatCacheHtml(personaId: string): string | null {
  return localStorage.getItem(STORAGE_KEYS.CHAT_CACHE_PREFIX + personaId);
}

export function setChatCacheHtml(personaId: string, html: string): void {
  try { localStorage.setItem(STORAGE_KEYS.CHAT_CACHE_PREFIX + personaId, html); } catch (e) {}
}

export function removeChatCacheHtml(personaId: string): void {
  localStorage.removeItem(STORAGE_KEYS.CHAT_CACHE_PREFIX + personaId);
}

/** Clear all per-persona chat caches from localStorage. Called on logout or user switch. */
export function clearAllChatCaches(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.CHAT_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/** Alias for clearAllChatCaches — used by AuthProvider on logout. */
export const clearChatCache = clearAllChatCaches;

/** 设置缓存归属用户ID（登录/切换用户时调用） */
export function setCacheOwner(userId: string | number): void {
  localStorage.setItem(STORAGE_KEYS.CACHE_OWNER, String(userId));
}

/** 获取缓存归属用户ID */
export function getCacheOwner(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CACHE_OWNER);
}

/** 清除缓存归属标记 */
export function removeCacheOwner(): void {
  localStorage.removeItem(STORAGE_KEYS.CACHE_OWNER);
}

/** 清除所有用户相关数据（token + 缓存 + 归属标记 + 上次用户ID），用于完整登出 */
export function clearAllUserData(): void {
  removeToken();
  clearAllChatCaches();
  removeCacheOwner();
  localStorage.removeItem(STORAGE_KEYS.LAST_USER_ID);
}
