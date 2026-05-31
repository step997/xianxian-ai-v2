import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import type { User } from '../types/shared-types';
import { getToken, setToken, clearAllUserData } from '../utils/storage';
import { getUsernameFromToken, getUserIdFromToken, isTokenExpired } from '../utils/jwt';
import * as api from '../services/api';

function parseUserFromToken(token: string): User | null {
  const username = getUsernameFromToken(token);
  const id = getUserIdFromToken(token);
  if (!username || id === null) return null;
  return { id: String(id), username };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = getToken();
    if (savedToken && !isTokenExpired(savedToken)) {
      setTokenState(savedToken);
      setUser(parseUserFromToken(savedToken));
    } else {
      // 【安全修复】token过期/无效时清除所有用户数据，防止残留缓存泄露给下一个用户
      clearAllUserData();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.login({ username, password });
    const newToken = response.access_token;
    setToken(newToken);
    setTokenState(newToken);
    setUser(parseUserFromToken(newToken));
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    await api.register({ username, password });
    await login(username, password);
  }, [login]);

  const logout = useCallback(() => {
    // 【安全修复】完整清除所有用户数据，不留残留
    clearAllUserData();
    setTokenState(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = { token, user, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
