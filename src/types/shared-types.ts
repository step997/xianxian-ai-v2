/** 人格对象 — 对齐 v1.0 PERSONAS 数组 */
export interface Persona {
  id: string;
  emoji: string;       // 🐱 🐾 🐼 🦋
  name: string;         // 小暖猫 / 冷都猫 / 憨憨熊猫 / 逍遥庄子
  color: string;        // 主题色 hex
  glow: string;         // 发光色 rgba
  tag: string;          // 简短标签
  quote: string;        // 口头禅
  group: string;        // 分组：基础萌宠 / 先贤智在
}

/** 对话消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  personaId: string;    // 关联人格ID（不是整个 Persona 对象）
  timestamp: string;    // ISO 8601
}

/** 用户对象 */
export interface User {
  id: string;
  username: string;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  password: string;
}
