/** POST /login 响应 */
export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

/** POST /register 响应 */
export interface RegisterResponse {
  message: string;
  user_id: number;
}

/** GET /chat?msg=&persona= 响应 */
export interface ChatResponse {
  persona: string;
  persona_display: string;
  reply: string;
}

/** GET /history 响应 */
export interface HistoryResponse {
  history: ChatRecord[];
}

export interface ChatRecord {
  message: string;
  reply: string;
  persona: string;
  created_at: string;
}

/** DELETE /api/history 响应 */
export interface DeleteHistoryResponse {
  ok: boolean;
  message: string;
}

/** POST /chat/reset 响应 */
export interface ResetChatResponse {
  ok: boolean;
  message: string;
}

/** GET /personas 响应 */
export interface PersonasResponse {
  personas: Array<{ id: string; display_name: string }>;
}

/** GET /api/health 响应 */
export interface HealthResponse {
  status: string;
}

/** 通用错误响应 */
export interface ErrorResponse {
  detail: string;
}

/** JWT Payload 结构 */
export interface JwtPayload {
  sub: number;       // user_id
  username: string;
  jti: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}
