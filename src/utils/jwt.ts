/** Decode JWT payload — matches v1.0 atob(token.split(".")[1]) exactly */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = atob(parts[1]);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
}

export function getUsernameFromToken(token: string): string {
  const payload = decodeJwt(token);
  return (payload?.username as string) || '';
}

export function getUserIdFromToken(token: string): number | null {
  const payload = decodeJwt(token);
  const sub = payload?.sub;
  // v1 backend JWT stores sub as a string; accept both
  if (typeof sub === 'number') return sub;
  if (typeof sub === 'string') { const n = parseInt(sub, 10); return isNaN(n) ? null : n; }
  return null;
}

export function getCreatedAtFromToken(token: string): string {
  const payload = decodeJwt(token);
  return (payload?.created_at as string) || '';
}
