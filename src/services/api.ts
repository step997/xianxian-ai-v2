import axios from 'axios';
import { getToken, clearAllUserData, getServerUrl } from '../utils/storage';
import { isTokenExpired } from '../utils/jwt';
import type { LoginRequest, RegisterRequest } from '../types/shared-types';
import type {
  LoginResponse, RegisterResponse, ChatResponse,
  HistoryResponse, DeleteHistoryResponse, ResetChatResponse,
} from '../types/api-types';

const api = axios.create({
  baseURL: getServerUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (isTokenExpired(token)) {
      clearAllUserData();
      window.location.href = '/login';
      return Promise.reject(new Error('Token expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        clearAllUserData();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** POST /login — JSON body, matching v1.0 api("POST", "/login", {...}) */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/login', data);
  return response.data;
}

/** POST /register — JSON body */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/register', data);
  return response.data;
}

/** GET /chat?msg=&persona= */
export async function sendChatMessage(message: string, personaId: string): Promise<ChatResponse> {
  const response = await api.get<ChatResponse>('/chat', {
    params: { msg: message, persona: personaId },
  });
  return response.data;
}

/** GET /history */
export async function getChatHistory(persona?: string): Promise<HistoryResponse> {
  const response = await api.get<HistoryResponse>('/history', {
    params: persona ? { persona } : {},
  });
  return response.data;
}

/** DELETE /api/history */
export async function deleteHistory(persona?: string): Promise<DeleteHistoryResponse> {
  const response = await api.delete<DeleteHistoryResponse>('/api/history', {
    params: persona ? { persona } : {},
  });
  return response.data;
}

/** POST /chat/reset */
export async function resetChat(persona?: string): Promise<ResetChatResponse> {
  const response = await api.post<ResetChatResponse>('/chat/reset', null, {
    params: persona ? { persona } : {},
  });
  return response.data;
}

export default api;
