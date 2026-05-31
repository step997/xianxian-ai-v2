# 先贤智在 v2.0 React+TS 重写 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 React 19 + TypeScript 6 + Vite 8 重写"先贤智在"前端，保持 v1.0 全部功能，适度改进 UX（URL 路由、Zustand 状态管理、类型安全）。

**Architecture:** React Router v7 四路由（/login, /chat, /persona, /me）+ AppLayout 共享壳；AuthContext + ThemeContext（React Context）管理认证和主题；chatStore + personaStore（Zustand + persist）管理聊天和人格；CSS Variables + data-theme 驱动三色主题；axios + 拦截器对接 FastAPI 后端。

**Tech Stack:** React 19.2, TypeScript 6.0, Vite 8.0, React Router 7.x, Zustand 5.x, Axios 1.x

**Source of truth:** 设计文档 `docs/superpowers/specs/2026-05-30-react-ts-rewrite-design.md`；v1.0 代码库 `D:\Projects\xianxian-ai\frontend\index.html`（~2500 行单文件 SPA）

---

### Task 1: 安装 Zustand 依赖

**Files:**
- Modify: `package.json`（安装后自动更新）

- [ ] **Step 1: 安装 zustand**

```powershell
npm install zustand
```

Expected: 添加 `zustand` 到 dependencies，无报错。如果 zustand v5 尚不可用，安装最新版（^5.x 或 ^4.x）。

- [ ] **Step 2: 验证安装**

```powershell
node -e "require('zustand'); console.log('OK')"
```

Expected: 输出 `OK`，无报错。

---

### Task 2: 修正 shared-types.ts + 新增 theme.ts 和 api-types.ts

**Files:**
- Modify: `src/types/shared-types.ts`
- Create: `src/types/theme.ts`
- Create: `src/types/api-types.ts`

- [ ] **Step 1: 改写 shared-types.ts，对齐 v1.0 实际数据结构**

v1.0 的 PERSONAS 数组字段与当前 shared-types.ts 的 Persona 接口不匹配。修正为 v1.0 实际字段。

```typescript
// src/types/shared-types.ts

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
```

- [ ] **Step 2: 创建 theme.ts**

```typescript
// src/types/theme.ts

export type Theme = 'dark' | 'light' | 'blue';

export const THEME_CYCLE: Theme[] = ['dark', 'light', 'blue'];

export const THEME_ICONS: Record<Theme, string> = {
  dark: '🌙',
  light: '☀️',
  blue: '💧',
};

export const THEME_LABELS: Record<Theme, string> = {
  dark: '暗黑模式',
  light: '纯白模式',
  blue: '蓝白模式',
};
```

- [ ] **Step 3: 创建 api-types.ts**

```typescript
// src/types/api-types.ts

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
```

- [ ] **Step 4: 提交**

```powershell
git add src/types/shared-types.ts src/types/theme.ts src/types/api-types.ts
git commit -m "feat: add type definitions aligned with v1.0 data structures"
```

---

### Task 3: 从 v1.0 迁移 CSS 文件

**Files:**
- Create: `src/styles/themes.css`
- Create: `src/styles/global.css`
- Create: `src/styles/animations.css`
- Create: `src/styles/responsive.css`

**Source:** `D:\Projects\xianxian-ai\frontend\index.html` 中的 `<style>` 块

- [ ] **Step 1: 提取 v1.0 的 CSS 变量定义 → themes.css**

打开 `D:\Projects\xianxian-ai\frontend\index.html`，复制 Part 0（CSS Variables）中所有 `:root, [data-theme="dark"]`、`[data-theme="light"]`、`[data-theme="blue"]` 三个块。这些块包含约 27 个 CSS 变量。

```css
/* src/styles/themes.css — 从 v1.0 直接迁移 */

/* ===== 暗黑模式（默认）===== */
:root,
[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-input: rgba(255, 255, 255, 0.1);
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --text-muted: #6c6c80;
  --border-color: rgba(255, 255, 255, 0.1);
  --border-light: rgba(255, 255, 255, 0.05);
  --accent-color: #ff8c42;
  --accent-glow: rgba(255, 140, 66, 0.5);
  --danger-color: #e74c3c;
  --success-color: #2ecc71;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --overlay-bg: rgba(0, 0, 0, 0.6);
  --scrollbar-thumb: rgba(255, 255, 255, 0.15);
  --scrollbar-track: transparent;
  --skeleton-base: rgba(255, 255, 255, 0.05);
  --skeleton-shine: rgba(255, 255, 255, 0.1);
  --toast-bg: rgba(30, 30, 50, 0.95);
  --modal-bg: #1e1e32;
  --sidebar-width: 200px;
  --bottom-nav-height: 64px;
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}

/* ===== 纯白模式 ===== */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  --bg-card: rgba(0, 0, 0, 0.03);
  --bg-input: rgba(0, 0, 0, 0.05);
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --border-color: rgba(0, 0, 0, 0.1);
  --border-light: rgba(0, 0, 0, 0.05);
  --accent-color: #e67e22;
  --accent-glow: rgba(230, 126, 34, 0.4);
  --danger-color: #c0392b;
  --success-color: #27ae60;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
  --overlay-bg: rgba(0, 0, 0, 0.4);
  --scrollbar-thumb: rgba(0, 0, 0, 0.15);
  --scrollbar-track: transparent;
  --skeleton-base: rgba(0, 0, 0, 0.05);
  --skeleton-shine: rgba(0, 0, 0, 0.08);
  --toast-bg: rgba(255, 255, 255, 0.95);
  --modal-bg: #ffffff;
}

/* ===== 蓝白模式 ===== */
[data-theme="blue"] {
  --bg-primary: #e8f4fd;
  --bg-secondary: #d0e8f9;
  --bg-tertiary: #b8d4f0;
  --bg-card: rgba(255, 255, 255, 0.5);
  --bg-input: rgba(255, 255, 255, 0.6);
  --text-primary: #1a365d;
  --text-secondary: #2c5282;
  --text-muted: #718096;
  --border-color: rgba(49, 130, 206, 0.2);
  --border-light: rgba(49, 130, 206, 0.1);
  --accent-color: #3182ce;
  --accent-glow: rgba(49, 130, 206, 0.4);
  --danger-color: #c53030;
  --success-color: #2f855a;
  --shadow-sm: 0 1px 3px rgba(49, 130, 206, 0.1);
  --shadow-md: 0 4px 12px rgba(49, 130, 206, 0.15);
  --shadow-lg: 0 8px 24px rgba(49, 130, 206, 0.2);
  --overlay-bg: rgba(26, 54, 93, 0.4);
  --scrollbar-thumb: rgba(49, 130, 206, 0.2);
  --scrollbar-track: transparent;
  --skeleton-base: rgba(49, 130, 206, 0.08);
  --skeleton-shine: rgba(49, 130, 206, 0.12);
  --toast-bg: rgba(255, 255, 255, 0.95);
  --modal-bg: #ffffff;
}
```

> **注意**: 上述 CSS 变量值是从 v1.0 设计模式推断的。实际迁移时请以 `D:\Projects\xianxian-ai\frontend\index.html` 中 Part 0 的精确值为准。如有差异以 v1.0 原文为准。

- [ ] **Step 2: 提取 v1.0 的重置和基础样式 → global.css**

从 v1.0 `index.html` 的 Part 1（Reset & Base）+ Part 4（Main Layout 基础结构）提取通用样式。

```css
/* src/styles/global.css */

/* ===== Reset & Base ===== */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Noto Sans SC", sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100dvh;
  transition: background-color var(--transition-normal), color var(--transition-normal);
  overflow: hidden; /* 桌面宠物 App 不需要 body 滚动 */
}

#root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ===== 字体导入 ===== */
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap');

.font-cute {
  font-family: 'ZCOOL KuaiLe', cursive;
}

/* ===== 滚动条美化 ===== */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ===== 通用链接 ===== */
a {
  color: var(--accent-color);
  text-decoration: none;
}

/* ===== 按钮重置 ===== */
button {
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

/* ===== 输入框重置 ===== */
input, textarea {
  font: inherit;
  color: inherit;
  border: none;
  outline: none;
  background: transparent;
}

/* ===== 选中高亮 ===== */
::selection {
  background: var(--accent-color);
  color: #fff;
}
```

- [ ] **Step 3: 提取 v1.0 的关键帧动画 → animations.css**

从 v1.0 `index.html` 的 Part 9（Animations）提取全部 9 个关键帧动画。

```css
/* src/styles/animations.css — 从 v1.0 Part 9 迁移 */

/* 宠物浮动 */
@keyframes avatarFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* 光环脉冲 */
@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* 消息滑入 */
@keyframes msgSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 加载点弹跳 */
@keyframes dotBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

/* 淡入上滑 */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 宠物颤抖 */
@keyframes petShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

/* 宠物开心 */
@keyframes petHappy {
  0% { transform: scale(1); }
  30% { transform: scale(1.2) rotate(5deg); }
  60% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1); }
}

/* 宠物切换 */
@keyframes petSwitch {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(0.3); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Emoji 漂浮 */
@keyframes emojiFloat {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
}

/* 骨架屏闪烁 */
@keyframes skeletonShimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

/* ===== 动画工具类 ===== */
.animate-float { animation: avatarFloat 3s ease-in-out infinite; }
.animate-msg-in { animation: msgSlideIn 0.3s ease-out forwards; }
.animate-fade-in { animation: fadeSlideIn 0.4s ease-out forwards; }
.animate-shake { animation: petShake 0.5s ease-in-out; }
.animate-happy { animation: petHappy 0.6s ease-in-out; }
.animate-switch { animation: petSwitch 0.4s ease-in-out; }
```

> **注意**: 以 v1.0 `index.html` Part 9 的精确关键帧定义为准，上述为推断版本。

- [ ] **Step 4: 提取 v1.0 的媒体查询 → responsive.css**

从 v1.0 `index.html` 的 Part 10（Responsive）提取断点规则。

```css
/* src/styles/responsive.css — 从 v1.0 Part 10 迁移 */

/* ===== 移动端 < 768px ===== */
@media (max-width: 767px) {
  :root {
    --sidebar-width: 0px;
  }

  .sidebar { display: none; }
  .bottom-nav { display: flex; }
  .main-content {
    margin-left: 0;
    padding-bottom: calc(var(--bottom-nav-height) + 16px);
  }
}

/* ===== 平板 768-1024px ===== */
@media (min-width: 768px) and (max-width: 1023px) {
  :root {
    --sidebar-width: 150px;
  }

  .sidebar { display: flex; width: 150px; }
  .bottom-nav { display: none; }
  .main-content { margin-left: 150px; padding-bottom: 16px; }
}

/* ===== PC ≥ 1024px ===== */
@media (min-width: 1024px) {
  :root {
    --sidebar-width: 200px;
  }

  .sidebar { display: flex; width: 200px; }
  .bottom-nav { display: none; }
  .main-content { margin-left: 200px; padding-bottom: 16px; }
}
```

> **注意**: 精确值以 v1.0 Part 10 的媒体查询为准。

- [ ] **Step 5: 删除 Vite 默认样式（index.css 和 App.css 的默认内容）**

```powershell
# 清空 index.css（保留文件，内容清空）
```

将 `src/index.css` 替换为只导入 styles 目录的文件：

```css
/* src/index.css — 样式入口 */
@import './styles/themes.css';
@import './styles/global.css';
@import './styles/animations.css';
@import './styles/responsive.css';
```

删除 `src/App.css`：

```powershell
Remove-Item src/App.css
```

- [ ] **Step 6: 提交**

```powershell
git add src/styles/themes.css src/styles/global.css src/styles/animations.css src/styles/responsive.css src/index.css
git rm src/App.css
git commit -m "feat: migrate v1.0 CSS to themed stylesheets"
```

---

### Task 4: 创建工具函数

**Files:**
- Create: `src/utils/jwt.ts`
- Create: `src/utils/storage.ts`

- [ ] **Step 1: 创建 JWT 解码工具**

```typescript
// src/utils/jwt.ts

import type { JwtPayload } from '../types/api-types';

/**
 * 解码 JWT payload（不做验签，仅读取数据）。
 * v1.0 等价逻辑: JSON.parse(atob(token.split('.')[1]))
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // 补齐 base64 padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 检查 JWT 是否已过期。
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  // exp 是秒级 Unix 时间戳
  return payload.exp * 1000 < Date.now();
}

/**
 * 从 JWT 中提取用户名。
 */
export function getUsernameFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.username ?? null;
}

/**
 * 从 JWT 中提取用户 ID。
 */
export function getUserIdFromToken(token: string): number | null {
  const payload = decodeJwt(token);
  return payload?.sub ?? null;
}
```

- [ ] **Step 2: 创建 localStorage 工具**

```typescript
// src/utils/storage.ts

const STORAGE_KEYS = {
  TOKEN: 'xianxian_token',
  THEME: 'xianxian_theme',
  PERSONA: 'xianxian_persona',
  SERVER: 'xianxian_server',
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
  return localStorage.getItem(STORAGE_KEYS.SERVER) || 'http://localhost:8000';
}

export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.SERVER, url);
}

/**
 * 清除所有聊天缓存（用户登出或切换账号时调用）。
 */
export function clearChatCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('xianxian_chatcache_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export { STORAGE_KEYS };
```

- [ ] **Step 3: 提交**

```powershell
git add src/utils/jwt.ts src/utils/storage.ts
git commit -m "feat: add JWT decode and localStorage utility functions"
```

---

### Task 5: 创建 API 服务层（axios 实例 + 拦截器）

**Files:**
- Create: `src/services/api.ts`

- [ ] **Step 1: 创建 axios 实例**

```typescript
// src/services/api.ts

import axios from 'axios';
import { getToken, removeToken, getServerUrl } from '../utils/storage';
import { isTokenExpired } from '../utils/jwt';
import type {
  LoginRequest,
  RegisterRequest,
} from '../types/shared-types';
import type {
  LoginResponse,
  RegisterResponse,
  ChatResponse,
  HistoryResponse,
  DeleteHistoryResponse,
  ResetChatResponse,
} from '../types/api-types';

const api = axios.create({
  baseURL: getServerUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/* ===== 请求拦截器：注入 JWT ===== */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (isTokenExpired(token)) {
      removeToken();
      window.location.href = '/login';
      return Promise.reject(new Error('Token expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ===== 响应拦截器：统一错误处理 ===== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        removeToken();
        window.location.href = '/login';
      }
      // 429 由调用方自行处理（展示倒计时）
    }
    return Promise.reject(error);
  }
);

/* ===== API 方法 ===== */

/** 登录 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);

  const response = await api.post<LoginResponse>('/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

/** 注册 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/register', data);
  return response.data;
}

/** 发送聊天消息 */
export async function sendChatMessage(
  message: string,
  personaId: string
): Promise<ChatResponse> {
  const response = await api.get<ChatResponse>('/chat', {
    params: { msg: message, persona: personaId },
  });
  return response.data;
}

/** 获取聊天历史 */
export async function getChatHistory(persona?: string): Promise<HistoryResponse> {
  const response = await api.get<HistoryResponse>('/history', {
    params: persona ? { persona } : {},
  });
  return response.data;
}

/** 删除聊天历史 */
export async function deleteHistory(persona?: string): Promise<DeleteHistoryResponse> {
  const response = await api.delete<DeleteHistoryResponse>('/api/history', {
    params: persona ? { persona } : {},
  });
  return response.data;
}

/** 重置对话上下文 */
export async function resetChat(persona?: string): Promise<ResetChatResponse> {
  const response = await api.post<ResetChatResponse>('/chat/reset', null, {
    params: persona ? { persona } : {},
  });
  return response.data;
}

export default api;
```

> **注意**: v1.0 使用 `application/x-www-form-urlencoded` 发送登录请求（fastapi OAuth2 默认格式）。如果后端接受 JSON，可改为 `data` 直传。

- [ ] **Step 2: 提交**

```powershell
git add src/services/api.ts
git commit -m "feat: add axios API service with auth interceptors"
```

---

### Task 6: 创建自定义 Hooks

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useTheme.ts`
- Create: `src/hooks/useMediaQuery.ts`

- [ ] **Step 1: 创建 useAuth hook**

```typescript
// src/hooks/useAuth.ts

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

- [ ] **Step 2: 创建 useTheme hook**

```typescript
// src/hooks/useTheme.ts

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 3: 创建 useMediaQuery hook**

```typescript
// src/hooks/useMediaQuery.ts

import { useState, useEffect } from 'react';

/**
 * 监听 CSS 媒体查询匹配状态。
 * 仅在需要条件渲染不同 DOM 结构时使用（如 PetAvatar 位置决策）。
 * 能用 CSS media query 解决的不要用这个 hook。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR 安全
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

- [ ] **Step 4: 创建 contexts 目录并建立 AuthContext 和 ThemeContext 骨架**

```powershell
New-Item -ItemType Directory -Force -Path "src/contexts"
```

```typescript
// src/contexts/AuthContext.tsx
import { createContext } from 'react';
import type { User } from '../types/shared-types';

export interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
```

```typescript
// src/contexts/ThemeContext.tsx
import { createContext } from 'react';
import type { Theme } from '../types/theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
```

- [ ] **Step 5: 提交**

```powershell
git add src/hooks/useAuth.ts src/hooks/useTheme.ts src/hooks/useMediaQuery.ts src/contexts/AuthContext.tsx src/contexts/ThemeContext.tsx
git commit -m "feat: add custom hooks and context type definitions"
```

---

### Task 7: 创建 AuthProvider 和 ThemeProvider

**Files:**
- Create: `src/contexts/AuthProvider.tsx`
- Create: `src/contexts/ThemeProvider.tsx`

- [ ] **Step 1: 创建 AuthProvider**

```typescript
// src/contexts/AuthProvider.tsx

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import type { User } from '../types/shared-types';
import { getToken, setToken, removeToken, clearChatCache } from '../utils/storage';
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

  // 启动时恢复会话
  useEffect(() => {
    const savedToken = getToken();
    if (savedToken && !isTokenExpired(savedToken)) {
      setTokenState(savedToken);
      setUser(parseUserFromToken(savedToken));
    } else {
      removeToken();
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
    // 注册成功后自动登录
    await login(username, password);
  }, [login]);

  const logout = useCallback(() => {
    clearChatCache();
    removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = { token, user, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

- [ ] **Step 2: 创建 ThemeProvider**

```typescript
// src/contexts/ThemeProvider.tsx

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextValue } from './ThemeContext';
import type { Theme } from '../types/theme';
import { getTheme, setTheme as saveTheme } from '../utils/storage';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = getTheme();
    if (saved === 'dark' || saved === 'light' || saved === 'blue') return saved;
    return 'dark';
  });

  // 同步到 DOM 和 localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) =>
      prev === 'dark' ? 'light' : prev === 'light' ? 'blue' : 'dark'
    );
  }, []);

  const value: ThemeContextValue = { theme, setTheme, cycleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

- [ ] **Step 3: 提交**

```powershell
git add src/contexts/AuthProvider.tsx src/contexts/ThemeProvider.tsx
git commit -m "feat: add AuthProvider and ThemeProvider with session restore"
```

---

### Task 8: 创建 Zustand Stores

**Files:**
- Create: `src/stores/chatStore.ts`
- Create: `src/stores/personaStore.ts`

- [ ] **Step 1: 创建 personaStore**

```typescript
// src/stores/personaStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Persona } from '../types/shared-types';
import { getPersona, setPersona } from '../utils/storage';

/** v1.0 人格数据 — 静态常量 */
export const PERSONAS: Persona[] = [
  {
    id: 'cat_warm', emoji: '🐱', name: '小暖猫', color: '#FF8C42',
    glow: 'rgba(255,140,66,0.5)', tag: '温暖贴心的小棉袄',
    quote: '我会一直陪着你~', group: '基础萌宠',
  },
  {
    id: 'cat_cool', emoji: '🐾', name: '冷都猫', color: '#4A5568',
    glow: 'rgba(74,85,104,0.5)', tag: '高冷优雅的都市猫',
    quote: '哼，随便你', group: '基础萌宠',
  },
  {
    id: 'panda', emoji: '🐼', name: '憨憨熊猫', color: '#A0AEC0',
    glow: 'rgba(160,174,192,0.5)', tag: '呆萌治愈的国宝',
    quote: '嘿嘿嘿~', group: '基础萌宠',
  },
  {
    id: 'zhuangzi', emoji: '🦋', name: '逍遥庄子', color: '#5A9E8F',
    glow: 'rgba(90,158,143,0.5)', tag: '逍遥游世的梦中蝴蝶',
    quote: '请循其本', group: '先贤智在',
  },
];

interface PersonaState {
  currentPersonaId: string;
  setCurrentPersonaId: (id: string) => void;
  getCurrentPersona: () => Persona | undefined;
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      currentPersonaId: getPersona() || 'cat_warm',

      setCurrentPersonaId: (id: string) => {
        setPersona(id);
        set({ currentPersonaId: id });
      },

      getCurrentPersona: () => {
        return PERSONAS.find((p) => p.id === get().currentPersonaId);
      },
    }),
    {
      name: 'xianxian_persona_store', // zustand persist key（不同于 v1.0 的 xianxian_persona）
    }
  )
);
```

> **注意**: 初始值从 `localStorage('xianxian_persona')` 读取以兼容 v1.0。同时 zustand persist 会自动同步。

- [ ] **Step 2: 创建 chatStore**

```typescript
// src/stores/chatStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '../types/shared-types';
import * as api from '../services/api';

interface ChatState {
  /** 所有消息，按 personaId 分组存储 */
  messagesByPersona: Record<string, ChatMessage[]>;
  isWaiting: boolean;
  error: string | null;

  /** 获取当前人格的消息列表 */
  getMessages: (personaId: string) => ChatMessage[];

  /** 发送消息 */
  sendMessage: (text: string, personaId: string) => Promise<void>;

  /** 从后端加载历史 */
  loadHistory: () => Promise<void>;

  /** 清除指定人格的消息（本地+后端） */
  clearHistory: (personaId: string) => Promise<void>;

  /** 内部：添加消息到指定人格 */
  _addMessage: (personaId: string, msg: ChatMessage) => void;
}

let msgCounter = Date.now();
function nextId(): string {
  return `msg_${++msgCounter}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messagesByPersona: {},
      isWaiting: false,
      error: null,

      getMessages: (personaId: string) => {
        return get().messagesByPersona[personaId] || [];
      },

      sendMessage: async (text: string, personaId: string) => {
        // 添加用户消息
        const userMsg: ChatMessage = {
          id: nextId(),
          role: 'user',
          content: text,
          personaId,
          timestamp: new Date().toISOString(),
        };
        get()._addMessage(personaId, userMsg);
        set({ isWaiting: true, error: null });

        try {
          const response = await api.sendChatMessage(text, personaId);
          const aiMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            content: response.reply,
            personaId,
            timestamp: new Date().toISOString(),
          };
          get()._addMessage(personaId, aiMsg);
        } catch (err) {
          const message = err instanceof Error ? err.message : '发送失败';
          set({ error: message });
        } finally {
          set({ isWaiting: false });
        }
      },

      loadHistory: async () => {
        try {
          const response = await api.getChatHistory();
          const grouped: Record<string, ChatMessage[]> = {};

          for (const record of response.history) {
            const pid = record.persona || 'cat_warm';
            if (!grouped[pid]) grouped[pid] = [];
            // 用户消息
            grouped[pid].push({
              id: nextId(),
              role: 'user',
              content: record.message,
              personaId: pid,
              timestamp: record.created_at,
            });
            // AI 回复
            grouped[pid].push({
              id: nextId(),
              role: 'assistant',
              content: record.reply,
              personaId: pid,
              timestamp: record.created_at,
            });
          }

          // 合并到现有消息（历史在前，新消息在后）
          set((state) => {
            const merged = { ...state.messagesByPersona };
            for (const [pid, msgs] of Object.entries(grouped)) {
              const existing = merged[pid] || [];
              // 去重：按 id 去重（同一轮 user+assistant 的 id 是新生成的，但 content 可能重复）
              const existingContents = new Set(existing.map((m) => m.content));
              const newMsgs = msgs.filter((m) => !existingContents.has(m.content));
              merged[pid] = [...newMsgs, ...existing];
            }
            return { messagesByPersona: merged };
          });
        } catch (err) {
          console.error('Failed to load chat history:', err);
        }
      },

      clearHistory: async (personaId: string) => {
        try {
          await api.deleteHistory(personaId);
        } catch {
          // 即使后端删除失败也清本地
        }
        set((state) => {
          const copy = { ...state.messagesByPersona };
          delete copy[personaId];
          return { messagesByPersona: copy };
        });
      },

      _addMessage: (personaId: string, msg: ChatMessage) => {
        set((state) => {
          const copy = { ...state.messagesByPersona };
          if (!copy[personaId]) copy[personaId] = [];
          copy[personaId] = [...copy[personaId], msg];
          return { messagesByPersona: copy };
        });
      },
    }),
    {
      name: 'xianxian_chat_store',
      partialize: (state) => ({
        // 只持久化消息数据，不持久化 isWaiting 和 error
        messagesByPersona: state.messagesByPersona,
      }),
    }
  )
);
```

- [ ] **Step 3: 提交**

```powershell
git add src/stores/chatStore.ts src/stores/personaStore.ts
git commit -m "feat: add Zustand stores for chat and persona with persist"
```

---

### Task 9: 创建基础 UI 组件

**Files:**
- Create: `src/components/Toast.tsx`
- Create: `src/components/Modal.tsx`
- Create: `src/components/ProtectedRoute.tsx`

- [ ] **Step 1: 创建 Toast 组件**

```typescript
// src/components/Toast.tsx

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {toasts.map((toast) => (
          <ToastItemView key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemView({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const bgColor = toast.type === 'error' ? 'var(--danger-color)'
    : toast.type === 'success' ? 'var(--success-color)'
    : 'var(--toast-bg)';

  return (
    <div className="toast animate-fade-in" style={{
      background: bgColor, color: '#fff', padding: '10px 20px',
      borderRadius: 12, fontSize: 14, boxShadow: 'var(--shadow-md)',
      whiteSpace: 'nowrap',
    }}>
      {toast.message}
    </div>
  );
}
```

- [ ] **Step 2: 创建 Modal 组件**

```typescript
// src/components/Modal.tsx

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, footer, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'var(--overlay-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--modal-bg)', borderRadius: 16, padding: 24,
        minWidth: 320, maxWidth: 480, width: '90%',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {title && (
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--text-primary)' }}>
            {title}
          </h3>
        )}
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {children}
        </div>
        {footer && (
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 ProtectedRoute 组件**

```typescript
// src/components/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', color: 'var(--text-secondary)',
      }}>
        加载中...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: 提交**

```powershell
git add src/components/Toast.tsx src/components/Modal.tsx src/components/ProtectedRoute.tsx
git commit -m "feat: add Toast, Modal, and ProtectedRoute base components"
```

---

### Task 10: 创建导航组件

**Files:**
- Create: `src/components/SidebarNav.tsx`
- Create: `src/components/BottomNav.tsx`

- [ ] **Step 1: 创建导航配置常量**

```typescript
// src/components/navConfig.ts

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'chat',    label: '聊天', icon: '💬', path: '/chat' },
  { id: 'persona', label: '人格', icon: '🎭', path: '/persona' },
  { id: 'me',      label: '我的', icon: '👤', path: '/me' },
];
```

- [ ] **Step 2: 创建 SidebarNav**

```typescript
// src/components/SidebarNav.tsx

import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navConfig';

export function SidebarNav() {
  return (
    <nav className="sidebar" style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 0',
      zIndex: 100,
      transition: 'width var(--transition-normal)',
    }}>
      {/* 品牌区 */}
      <div style={{
        padding: '0 16px 24px', textAlign: 'center',
        fontSize: 20, fontFamily: "'ZCOOL KuaiLe', cursive",
        color: 'var(--text-primary)',
      }}>
        先贤智在
      </div>

      {/* 导航项 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 15,
              color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            })}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: 创建 BottomNav**

```typescript
// src/components/BottomNav.tsx

import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navConfig';

export function BottomNav() {
  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--bottom-nav-height)',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 16px',
            color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: 11,
            transition: 'color var(--transition-fast)',
          })}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: 提交**

```powershell
git add src/components/navConfig.ts src/components/SidebarNav.tsx src/components/BottomNav.tsx
git commit -m "feat: add SidebarNav and BottomNav with React Router NavLink"
```

---

### Task 11: 创建 PetAvatar 组件

**Files:**
- Create: `src/components/PetAvatar.tsx`
- Create: `src/components/PetAnimator.ts`

- [ ] **Step 1: 创建 PetAnimator 工具**

```typescript
// src/components/PetAnimator.ts

export type PetAnimation = 'idle' | 'happy' | 'switch' | 'shake' | 'thinking';

type AnimCallback = () => void;

class PetAnimatorClass {
  private callbacks = new Map<PetAnimation, Set<AnimCallback>>();

  on(anim: PetAnimation, cb: AnimCallback): () => void {
    if (!this.callbacks.has(anim)) this.callbacks.set(anim, new Set());
    this.callbacks.get(anim)!.add(cb);
    return () => this.callbacks.get(anim)?.delete(cb);
  }

  play(anim: PetAnimation): void {
    this.callbacks.get(anim)?.forEach((cb) => cb());
  }
}

export const PetAnimator = new PetAnimatorClass();
```

- [ ] **Step 2: 创建 PetAvatar 组件**

```typescript
// src/components/PetAvatar.tsx

import { useState, useEffect } from 'react';
import { usePersonaStore } from '../stores/personaStore';
import { PetAnimator, type PetAnimation } from './PetAnimator';

export function PetAvatar() {
  const persona = usePersonaStore((s) => {
    const p = s.getCurrentPersona();
    return p ? { emoji: p.emoji, name: p.name, color: p.color, glow: p.glow } : null;
  });

  const [animation, setAnimation] = useState<PetAnimation>('idle');
  const [switching, setSwitching] = useState(false);

  // 监听人格切换 → switch 动画
  useEffect(() => {
    setSwitching(true);
    const timer = setTimeout(() => setSwitching(false), 400);
    return () => clearTimeout(timer);
  }, [persona?.emoji]);

  // 监听动画事件
  useEffect(() => {
    const unsubs = [
      PetAnimator.on('happy', () => setAnimation('happy')),
      PetAnimator.on('shake', () => setAnimation('shake')),
      PetAnimator.on('thinking', () => setAnimation('thinking')),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  // 动画结束后回到 idle
  useEffect(() => {
    if (animation === 'idle') return;
    const timer = setTimeout(() => setAnimation('idle'), 600);
    return () => clearTimeout(timer);
  }, [animation]);

  if (!persona) return null;

  const animClass =
    switching ? 'animate-switch' :
    animation === 'happy' ? 'animate-happy' :
    animation === 'shake' ? 'animate-shake' :
    animation === 'thinking' ? 'animate-shake' :
    'animate-float';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* 光环 */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: persona.glow,
          position: 'absolute', top: -4, left: -4,
          animation: 'ringPulse 2s ease-in-out infinite',
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: `2px solid ${persona.color}`,
          position: 'absolute', top: -8, left: -8,
          opacity: 0.4,
        }} />
        {/* Emoji 面部 */}
        <div className={animClass} style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          position: 'relative', zIndex: 1,
        }}>
          {persona.emoji}
        </div>
      </div>
      {/* 名字 */}
      <span style={{
        fontSize: 13, color: 'var(--text-secondary)',
        fontFamily: "'ZCOOL KuaiLe', cursive",
      }}>
        {persona.name}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```powershell
git add src/components/PetAnimator.ts src/components/PetAvatar.tsx
git commit -m "feat: add PetAvatar component with CSS animation system"
```

---

### Task 12: 创建 AppLayout 共享壳

**Files:**
- Create: `src/components/AppLayout.tsx`

- [ ] **Step 1: 创建 AppLayout**

```typescript
// src/components/AppLayout.tsx

import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import { PetAvatar } from './PetAvatar';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100dvh' }}>
        {/* 侧边栏（平板/PC）*/}
        <SidebarNav />

        {/* 主内容区 */}
        <main className="main-content" style={{
          flex: 1,
          marginLeft: 'var(--sidebar-width)',
          paddingBottom: 'var(--bottom-nav-height)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left var(--transition-normal)',
        }}>
          <Outlet />
        </main>

        {/* 底部导航（移动端）*/}
        <BottomNav />

        {/* 侧边栏宠物（平板/PC）*/}
        {!isMobile && (
          <div style={{
            position: 'fixed', left: 0, bottom: 24,
            width: 'var(--sidebar-width)',
            display: 'flex', justifyContent: 'center',
            zIndex: 101,
          }}>
            <PetAvatar />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

- [ ] **Step 2: 提交**

```powershell
git add src/components/AppLayout.tsx
git commit -m "feat: add AppLayout shared shell with dual-nav and PetAvatar"
```

---

### Task 13: 创建 LoginPage（含 LoginForm 和 RegisterForm）

**Files:**
- Create: `src/pages/LoginPage.tsx`

- [ ] **Step 1: 创建 LoginPage**

```typescript
// src/pages/LoginPage.tsx

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      return;
    }

    if (username.length < 2 || username.length > 32) {
      setError('用户名需 2-32 个字符');
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError('密码需 8-128 个字符');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate('/chat', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        if (axiosErr.response?.status === 409) {
          setError('用户名已存在');
        } else if (axiosErr.response?.status === 429) {
          setError('请求太频繁，请稍后再试');
        } else {
          setError(axiosErr.response?.data?.detail || '操作失败');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('操作失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
    }}>
      <div className="animate-fade-in" style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-secondary)',
        borderRadius: 20, padding: 40,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center', marginBottom: 32,
          fontSize: 36, fontFamily: "'ZCOOL KuaiLe', cursive",
          color: 'var(--text-primary)',
        }}>
          🐱 先贤智在
        </div>

        {/* Tab 切换 */}
        <div style={{
          display: 'flex', marginBottom: 24,
          background: 'var(--bg-card)', borderRadius: 10, padding: 4,
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              fontSize: 15, fontWeight: 500,
              color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
              background: mode === 'login' ? 'var(--accent-color)' : 'transparent',
              transition: 'all var(--transition-fast)',
            }}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              fontSize: 15, fontWeight: 500,
              color: mode === 'register' ? '#fff' : 'var(--text-secondary)',
              background: mode === 'register' ? 'var(--accent-color)' : 'transparent',
              transition: 'all var(--transition-fast)',
            }}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 10, fontSize: 15,
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 10, fontSize: 15,
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--danger-color)', fontSize: 13,
              marginBottom: 8, padding: '8px 12px',
              background: 'rgba(231,76,60,0.1)', borderRadius: 8,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '12px 0',
              borderRadius: 10, fontSize: 16, fontWeight: 600,
              color: '#fff',
              background: isSubmitting ? 'var(--text-muted)' : 'var(--accent-color)',
              transition: 'all var(--transition-fast)',
              marginTop: 16,
            }}
          >
            {isSubmitting ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```powershell
git add src/pages/LoginPage.tsx
git commit -m "feat: add LoginPage with login/register form and validation"
```

---

### Task 14: 创建 PersonaPage

**Files:**
- Create: `src/pages/PersonaPage.tsx`
- Create: `src/components/PersonaCard.tsx`

- [ ] **Step 1: 创建 PersonaCard 组件**

```typescript
// src/components/PersonaCard.tsx

import type { Persona } from '../types/shared-types';
import { usePersonaStore } from '../stores/personaStore';
import { PetAnimator } from './PetAnimator';

interface PersonaCardProps {
  persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const currentPersonaId = usePersonaStore((s) => s.currentPersonaId);
  const setCurrentPersonaId = usePersonaStore((s) => s.setCurrentPersonaId);
  const isActive = currentPersonaId === persona.id;

  const handleSelect = () => {
    if (isActive) {
      // 已选中：弹跳动画
      PetAnimator.play('happy');
      return;
    }
    setCurrentPersonaId(persona.id);
    PetAnimator.play('switch');
  };

  return (
    <button
      onClick={handleSelect}
      className="persona-card"
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        width: '100%', padding: 20,
        borderRadius: 16,
        background: isActive ? `linear-gradient(135deg, ${persona.glow}, transparent)` : 'var(--bg-card)',
        border: isActive ? `2px solid ${persona.color}` : '2px solid var(--border-color)',
        textAlign: 'left',
        transition: 'all var(--transition-normal)',
        cursor: 'pointer',
      }}
    >
      {/* Emoji */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--bg-input)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
        flexShrink: 0,
        boxShadow: isActive ? `0 0 16px ${persona.glow}` : 'none',
      }}>
        {persona.emoji}
      </div>

      {/* 信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 17, fontWeight: 600,
          color: isActive ? persona.color : 'var(--text-primary)',
          fontFamily: "'ZCOOL KuaiLe', cursive",
        }}>
          {persona.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {persona.tag}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
          "{persona.quote}"
        </div>
      </div>

      {/* 选中标记 */}
      {isActive && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: persona.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff',
          flexShrink: 0,
        }}>
          ✓
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 2: 创建 PersonaPage**

```typescript
// src/pages/PersonaPage.tsx

import { PersonaCard } from '../components/PersonaCard';
import { PERSONAS } from '../stores/personaStore';

export function PersonaPage() {
  // 按 group 分组
  const groups = new Map<string, typeof PERSONAS>();
  for (const p of PERSONAS) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group)!.push(p);
  }

  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: 24,
      maxWidth: 600, margin: '0 auto', width: '100%',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 700,
        color: 'var(--text-primary)',
        fontFamily: "'ZCOOL KuaiLe', cursive",
        marginBottom: 8,
      }}>
        🎭 选择 AI 人格
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        选择不同的 AI 人格，体验不同的对话风格
      </p>

      {Array.from(groups.entries()).map(([group, personas]) => (
        <div key={group} style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: 12,
            letterSpacing: 1,
          }}>
            {group}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {personas.map((p) => (
              <PersonaCard key={p.id} persona={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```powershell
git add src/components/PersonaCard.tsx src/pages/PersonaPage.tsx
git commit -m "feat: add PersonaPage with grouped persona cards"
```

---

### Task 15: 创建 ChatPage

**Files:**
- Create: `src/pages/ChatPage.tsx`
- Create: `src/components/ChatMessages.tsx`
- Create: `src/components/ChatInput.tsx`

- [ ] **Step 1: 创建 ChatMessages 组件**

```typescript
// src/components/ChatMessages.tsx

import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';
import type { ChatMessage } from '../types/shared-types';

export function ChatMessages() {
  const personaId = usePersonaStore((s) => s.currentPersonaId);
  const messages = useChatStore((s) => s.getMessages(personaId));
  const isWaiting = useChatStore((s) => s.isWaiting);
  const persona = usePersonaStore((s) => s.getCurrentPersona());

  const bottomRef = useRef<HTMLDivElement>(null);

  // 新消息到达时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  if (messages.length === 0 && !isWaiting) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 15,
        padding: 40, textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{persona?.emoji || '💬'}</div>
          <div>和 {persona?.name || 'AI'} 开始对话吧~</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: '16px 20px',
    }}>
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}

      {/* 输入中指示器 */}
      {isWaiting && (
        <div className="animate-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', color: 'var(--text-muted)', fontSize: 14,
        }}>
          <span>{persona?.emoji}</span>
          <span>正在思考</span>
          <span className="animate-float" style={{ display: 'flex', gap: 3 }}>
            <span style={{ animation: 'dotBounce 1.4s infinite' }}>.</span>
            <span style={{ animation: 'dotBounce 1.4s infinite 0.2s' }}>.</span>
            <span style={{ animation: 'dotBounce 1.4s infinite 0.4s' }}>.</span>
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const persona = usePersonaStore((s) => s.getCurrentPersona());
  const isUser = message.role === 'user';

  return (
    <div className="animate-msg-in" style={{
      display: 'flex', gap: 10,
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
    }}>
      {/* AI 头像 */}
      {!isUser && persona && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg-input)', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {persona.emoji}
        </div>
      )}

      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--accent-color)' : 'var(--bg-card)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: 14,
        lineHeight: 1.6,
        wordBreak: 'break-word',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* 非用户消息显示发送者 */}
        {!isUser && persona && (
          <div style={{
            fontSize: 11, color: persona.color,
            marginBottom: 4, fontWeight: 600,
            fontFamily: "'ZCOOL KuaiLe', cursive",
          }}>
            {persona.name}
          </div>
        )}
        {message.content}
      </div>

      {/* 用户头像（占位，保持对齐）*/}
      {isUser && <div style={{ width: 32, flexShrink: 0 }} />}
    </div>
  );
}
```

- [ ] **Step 2: 创建 ChatInput 组件**

```typescript
// src/components/ChatInput.tsx

import { useState, type KeyboardEvent, type FormEvent } from 'react';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';

export function ChatInput() {
  const [text, setText] = useState('');
  const personaId = usePersonaStore((s) => s.currentPersonaId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isWaiting = useChatStore((s) => s.isWaiting);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isWaiting) return;
    if (trimmed.length > 500) {
      // 简单截断提示由外部 Toast 处理
      return;
    }
    setText('');
    await sendMessage(trimmed, personaId);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-end',
        maxWidth: 700, margin: '0 auto',
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          rows={1}
          disabled={isWaiting}
          style={{
            flex: 1, resize: 'none',
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            fontSize: 14,
            lineHeight: 1.5,
            minHeight: 42,
            maxHeight: 120,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isWaiting || !text.trim()}
          style={{
            width: 42, height: 42, borderRadius: 12,
            background: isWaiting || !text.trim() ? 'var(--bg-card)' : 'var(--accent-color)',
            color: '#fff', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all var(--transition-fast)',
          }}
        >
          {isWaiting ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 ChatPage**

```typescript
// src/pages/ChatPage.tsx

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
  const personaId = usePersonaStore((s) => s.currentPersonaId);

  // 首次进入聊天页时加载历史
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* 顶部栏：当前人格信息 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        {isMobile && <PetAvatar />}
        <div>
          <PersonaHeader />
        </div>
      </div>

      {/* 消息列表 */}
      <ChatMessages />

      {/* 输入框 */}
      <ChatInput />
    </div>
  );
}

function PersonaHeader() {
  const persona = usePersonaStore((s) => s.getCurrentPersona());
  const error = useChatStore((s) => s.error);

  if (!persona) return null;

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
        {persona.name}
      </div>
      <div style={{ fontSize: 12, color: error ? 'var(--danger-color)' : 'var(--text-muted)' }}>
        {error || persona.tag}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```powershell
git add src/components/ChatMessages.tsx src/components/ChatInput.tsx src/pages/ChatPage.tsx
git commit -m "feat: add ChatPage with messages, input, and typing indicator"
```

---

### Task 16: 创建 MePage

**Files:**
- Create: `src/pages/MePage.tsx`

- [ ] **Step 1: 创建 MePage**

```typescript
// src/pages/MePage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { THEME_ICONS, THEME_LABELS } from '../types/theme';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export function MePage() {
  const { user, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const clearHistory = useChatStore((s) => s.clearHistory);
  const personaId = usePersonaStore((s) => s.currentPersonaId);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleClearHistory = async () => {
    await clearHistory(personaId);
    setShowClearModal(false);
    showToast('聊天记录已清除', 'success');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: 24,
      maxWidth: 600, margin: '0 auto', width: '100%',
    }}>
      {/* 用户信息卡片 */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: 24,
        border: '1px solid var(--border-color)', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: '#fff',
          fontFamily: "'ZCOOL KuaiLe', cursive",
        }}>
          {user?.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.username || '未知用户'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ID: {user?.id || '-'}
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}>
        {/* 主题切换 */}
        <button
          onClick={cycleTheme}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            color: 'var(--text-primary)', fontSize: 15,
          }}
        >
          <span>🎨 主题</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {THEME_ICONS[theme]} {THEME_LABELS[theme]}
          </span>
        </button>

        {/* 清除聊天记录 */}
        <button
          onClick={() => setShowClearModal(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            color: 'var(--text-primary)', fontSize: 15,
          }}
        >
          <span>🗑️ 清除当前聊天记录</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>›</span>
        </button>

        {/* 关于 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            ℹ️ 关于
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            先贤智在 v2.0<br />
            AI 桌宠 · React + TypeScript<br />
            Powered by DeepSeek
          </div>
        </div>

        {/* 退出登录 */}
        <button
          onClick={() => setShowLogoutModal(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            color: 'var(--danger-color)', fontSize: 15,
          }}
        >
          <span>🚪 退出登录</span>
          <span style={{ fontSize: 13 }}>›</span>
        </button>
      </div>

      {/* 清除聊天记录确认弹窗 */}
      <Modal
        isOpen={showClearModal}
        title="确认清除"
        onClose={() => setShowClearModal(false)}
        footer={
          <>
            <button onClick={() => setShowClearModal(false)} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14,
              background: 'var(--bg-input)', color: 'var(--text-primary)',
            }}>
              取消
            </button>
            <button onClick={handleClearHistory} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14,
              background: 'var(--danger-color)', color: '#fff',
            }}>
              确认清除
            </button>
          </>
        }
      >
        确定要清除当前人格的所有聊天记录吗？此操作不可恢复。
      </Modal>

      {/* 退出登录确认弹窗 */}
      <Modal
        isOpen={showLogoutModal}
        title="确认退出"
        onClose={() => setShowLogoutModal(false)}
        footer={
          <>
            <button onClick={() => setShowLogoutModal(false)} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14,
              background: 'var(--bg-input)', color: 'var(--text-primary)',
            }}>
              取消
            </button>
            <button onClick={handleLogout} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14,
              background: 'var(--danger-color)', color: '#fff',
            }}>
              退出登录
            </button>
          </>
        }
      >
        确定要退出登录吗？
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```powershell
git add src/pages/MePage.tsx
git commit -m "feat: add MePage with profile, theme toggle, clear history, and logout"
```

---

### Task 17: 组装 App.tsx（路由 + Provider）

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 改写 App.tsx**

```typescript
// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/Toast';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { PersonaPage } from './pages/PersonaPage';
import { MePage } from './pages/MePage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* 公开路由 */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes（AppLayout 内含 ProtectedRoute 守卫）*/}
              <Route element={<AppLayout />}>
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/persona" element={<PersonaPage />} />
                <Route path="/me" element={<MePage />} />
              </Route>

              {/* 默认重定向 */}
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: 提交**

```powershell
git add src/App.tsx
git commit -m "feat: wire up App with providers, routes, and layout"
```

---

### Task 18: 更新 main.tsx 入口

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: 精简 main.tsx**

```typescript
// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: 更新 index.html 的 Google Fonts 引用**

检查 `index.html` 是否包含 ZCOOL KuaiLe 字体引用：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" rel="stylesheet">
```

如果不存在，添加到 `<head>` 中。

- [ ] **Step 3: 提交**

```powershell
git add src/main.tsx index.html
git commit -m "chore: update main entry and add Google Fonts link"
```

---

### Task 19: 清理 Vite 默认资源

**Files:**
- Delete: `src/assets/react.svg`（不再需要）
- Delete: `src/assets/vite.svg`（不再需要）
- Modify: `vite.config.ts`（按需调整）

- [ ] **Step 1: 删除 Vite 默认 SVG 和 hero.png**

```powershell
Remove-Item src/assets/react.svg
Remove-Item src/assets/vite.svg
Remove-Item src/assets/hero.png -ErrorAction SilentlyContinue
```

- [ ] **Step 2: 更新 index.html 标题**

```html
<title>先贤智在</title>
```

- [ ] **Step 3: 提交**

```powershell
git rm src/assets/react.svg src/assets/vite.svg
# hero.png 如果存在也删除
git add index.html
git commit -m "chore: remove Vite default assets, set Chinese title"
```

---

### Task 20: 启动验证 + 最终检查

**Files:**
- No new files

- [ ] **Step 1: TypeScript 编译检查**

```powershell
npx tsc --noEmit
```

Expected: 零错误 或 仅有未使用变量的 warning（warnings 可接受）。

如有类型错误，逐一修复。

- [ ] **Step 2: 启动开发服务器**

```powershell
npm run dev
```

Expected: Vite 在 `http://localhost:5173/` 启动成功。

- [ ] **Step 3: 功能验证清单**

在浏览器中测试：
- [ ] `/login` — 登录/注册表单正常渲染
- [ ] `/chat` — 聊天页正常渲染，PetAvatar 可见
- [ ] `/persona` — 人格页面渲染 4 张卡片
- [ ] `/me` — 我的页面渲染设置列表
- [ ] 主题切换 — 三色主题正常循环
- [ ] 移动端视图 — 缩小窗口 <768px，底部导航出现，侧边栏消失
- [ ] 未登录访问 `/chat` — 自动跳转到 `/login`

- [ ] **Step 4: 连接后端验证（如果后端在运行）**

确保 FastAPI 后端在 `http://localhost:8000` 运行，测试：
- [ ] `/login` 登录成功，JWT 存储在 localStorage
- [ ] `/chat` 发送消息，AI 回复正常
- [ ] 人格切换后对话上下文正确

- [ ] **Step 5: 最终提交**

```powershell
git add -A
git commit -m "feat: complete React+TS rewrite of 先贤智在 v2.0 frontend"
```

---

## 附录：实现顺序依赖图

```
Task 1 (zustand)
  └── Task 2 (types)
       ├── Task 3 (CSS)
       ├── Task 4 (utils)
       │    └── Task 5 (api service)
       │         ├── Task 7 (providers)
       │         │    └── Task 6 (hooks) ─── 依赖 contexts 定义
       │         └── Task 8 (stores)
       ├── Task 9 (base components: Toast, Modal, ProtectedRoute)
       │    └── Task 10 (nav components)
       │         └── Task 11 (PetAvatar)
       │              └── Task 12 (AppLayout)
       │                   ├── Task 13 (LoginPage)
       │                   ├── Task 14 (PersonaPage)
       │                   ├── Task 15 (ChatPage)
       │                   └── Task 16 (MePage)
       │                        └── Task 17 (App.tsx wiring)
       │                             └── Task 18 (main.tsx)
       │                                  └── Task 19 (cleanup)
       │                                       └── Task 20 (verify)
```

Task 2-8 可部分并行。Task 6 的 hooks 在 Task 7 的 contexts 定义后完成（hooks 引用了 context 类型）。
