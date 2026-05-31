# 先贤智在 v2.0 — React + TypeScript 重写技术方案

> **状态**: 已通过  
> **日期**: 2026-05-30  
> **版本**: v1.0  
> **上下文**: 基于 v1.0 原生 HTML/CSS/JS 代码库，用 React 19 + TypeScript 6 + Vite 8 重写前端。后端 FastAPI + SQLite 保持不变。

---

## 1. 项目定位

- **类型**: 适度改进的前端重写
- **目标**: 提升可维护性和类型安全，允许小的 UX 优化（URL 路由、动画微调、布局优化），不新增功能
- **后端**: 不变（FastAPI + SQLite，15 个源文件，~10 个 API 端点）
- **v1.0 参考**: 单文件 SPA（frontend/index.html，~2500行），四种 AI 人格，三 Tab 架构，JWT 认证，三色主题

---

## 2. 组件树设计

### 2.1 整体结构

```
<App>
  <AuthProvider>              ← Context: JWT token, user, login/register/logout
  <ThemeProvider>             ← Context: theme cycle, data-theme 属性
  <BrowserRouter>
    <Routes>
      /login    → <LoginPage>
                     ├── <LoginForm />
                     └── <RegisterForm />
      /          → <AppLayout>           ← 共享壳（Protected Route）
                     ├── <PetAvatar />         ← 侧边栏宠物 (≥768px)
                     ├── <SidebarNav />        ← 垂直导航 (≥768px)
                     ├── <BottomNav />         ← 底部导航 (<768px)
                     ├── <Outlet />
                     │    ├── /chat    → <ChatPage>
                     │    │               ├── <ChatMessages />
                     │    │               ├── <MobilePetArea />   ← 宠物 (<768px)
                     │    │               ├── <ChatInput />
                     │    │               └── <EmojiPicker />
                     │    ├── /persona → <PersonaPage>
                     │    │               └── <PersonaCardList />
                     │    │                    └── <PersonaCard /> (×4)
                     │    └── /me      → <MePage>
                     │                    ├── <ProfileCard />
                     │                    ├── <ThemeSettings />
                     │                    └── <SecuritySettings />
                     ├── <Toast />             ← 全局消息提示
                     └── <Modal />             ← 通用弹窗
    </Routes>
  </BrowserRouter>
</App>
```

### 2.2 组件职责

| 组件 | 职责 | v1.0 对应 |
|------|------|-----------|
| `AppLayout` | 共享壳：Protected Route 守卫 + 双导航渲染 + 全局 UI | `#appContainer` |
| `SidebarNav` | 平板/PC 垂直导航，路由驱动高亮 | `#sidebarNav` |
| `BottomNav` | 移动端底部导航，路由驱动高亮 | `#bottomNav` |
| `PetAvatar` | 宠物头像（emoji + 光环动画），PC在侧边栏/移动端在聊天页 | `#sidebarPet` + `#mobilePetArea` |
| `ChatMessages` | 消息列表渲染、滚动管理、输入中指示器 | `#chatMessages` + 手动 innerHTML |
| `ChatInput` | 输入框 + 发送按钮 + 表情选择器 | `#chatInputArea` |
| `PersonaCard` | 单个人格卡片（emoji/名称/标签/引言/选择态） | JS `buildPersonaList()` |
| `ProfileCard` | 用户头像/用户名/ID 展示 | 我的页面顶部 |
| `LoginForm` / `RegisterForm` | 登录/注册表单 + 表单验证 | `#authPanel` |

### 2.3 关键区别（vs v1.0）

- v1.0 dual-nav 同步靠 `updateNavActive()` 手动同步两个 DOM 树 → v2.0 路由驱动，天然统一
- v1.0 Tab 切换靠 `display:none` → v2.0 路由切换 + `<Outlet />`
- v1.0 PetAvatar 放在两个独立 DOM 位置 → v2.0 条件渲染同一个组件

---

## 3. 状态管理

### 3.1 方案: Context + Zustand 混合

| 状态层 | 技术 | 内容 | 持久化 |
|--------|------|------|--------|
| **AuthContext** | React Context | `token`, `user`, `login()`, `logout()`, `register()` | localStorage (`xianxian_token`) |
| **ThemeContext** | React Context | `theme`, `cycleTheme()`, `setTheme()` | localStorage (`xianxian_theme`) |
| **chatStore** | Zustand | `messages[]`, `isWaiting`, `sendMessage()`, `loadHistory()` | Zustand persist → localStorage (`xianxian_chatcache_*`) |
| **personaStore** | Zustand | `currentPersonaId`, `personas[]`, `selectPersona()` | localStorage (`xianxian_persona`) |

### 3.2 为什么 Context 管认证和主题

- 认证状态变化频率极低（仅在登录/登出时变化），不会引起不必要的 re-render
- 主题是全局 CSS 属性，放 Context 天然向下传递，且主题切换走 CSS 变量不触发 React re-render

### 3.3 为什么 Zustand 管聊天

- 聊天消息追加频率高（每条消息更新一次），Context 会导致整个子树 re-render
- Zustand selector 精确订阅（`useChatStore(s => s.messages)`），只有消息变化时才重渲染
- Zustand `persist` 中间件一行代码搞定 localStorage 同步，替代 v1.0 手写的 `saveChatCache()` 和 `state.chatCache`

### 3.4 备选方案（已否决）

- **纯 Context**: 聊天高频更新会引发性能问题，需要额外 `useMemo`/`React.memo` 优化，增加复杂度
- **Redux Toolkit**: 对当前状态规模（~10 个状态变量）过度设计，bundle 增加 11KB

---

## 4. 路由设计

### 4.1 URL 结构

```
/login        → LoginPage      (公开路由，未登录可访问)
/chat         → ChatPage       (Protected Route)
/persona      → PersonaPage    (Protected Route)
/me           → MePage         (Protected Route)
```

### 4.2 路由守卫

```typescript
// 伪代码
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
```

`AppLayout` 包裹在 `ProtectedRoute` 内，`/login` 在外部。

### 4.3 与 v1.0 的区别

- v1.0: 单页面，`state.currentTab` 切换 `display:none/flex`，无 URL
- v2.0: 多路由，URL 可分享/书签，浏览器前进/后退，导航高亮由 `<NavLink>` 驱动

---

## 5. 前后端类型定义

### 5.1 策略: 前端独立定义，手动对齐后端 Pydantic

不物理共享类型文件（后端 Python，前端 TypeScript，无共享条件）。

### 5.2 类型文件组织

```
src/types/
  shared-types.ts    ← Persona, ChatMessage, User, LoginRequest, RegisterRequest（已创建）
  api-types.ts       ← API 响应类型
  theme.ts           ← Theme 联合类型
```

### 5.3 API 响应类型（手动对齐）

```typescript
// api-types.ts
interface LoginResponse { access_token: string; token_type: string; }
interface ChatResponse { persona: string; persona_display: string; reply: string; }
interface HistoryResponse { history: ChatRecord[]; }
interface ChatRecord { message: string; reply: string; persona: string; created_at: string; }
interface ErrorResponse { detail: string; }
interface HealthResponse { status: string; }
```

### 5.4 备选方案（暂不采用）

- **OpenAPI 自动生成**: FastAPI 自带 OpenAPI schema，可用 `openapi-typescript` 自动生成。接口已稳定（10个端点），投入产出比不高，长期可考虑。

---

## 6. 主题切换

### 6.1 方案: CSS Variables + `data-theme` 属性

与 v1.0 完全一致的方案，从 v1.0 直接迁移 27 个 CSS 变量。

```typescript
// ThemeContext 核心逻辑
type Theme = 'dark' | 'light' | 'blue';

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('xianxian_theme') as Theme) || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('xianxian_theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'blue' : 'dark');
  };

  return <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>{children}</ThemeContext.Provider>;
}
```

```css
/* styles/themes.css — 从 v1.0 直接迁移 */
:root, [data-theme="dark"]   { --bg-primary: #1a1a2e; --text-primary: #e0e0e0; /* ... */ }
[data-theme="light"]         { --bg-primary: #ffffff; --text-primary: #212529; /* ... */ }
[data-theme="blue"]          { --bg-primary: #e8f4fd; --text-primary: #1a365d; /* ... */ }
```

### 6.2 关键设计决策

- 主题切换**不触发 React re-render**（纯 CSS 层面）
- 过渡动画 0.3s 在 CSS 中设定
- 主题切换按钮图标: 🌙 → ☀️ → 💧（与 v1.0 一致）
- 主题状态放在 Context 而非 Zustand（不是数据状态，是视觉属性）

### 6.3 备选方案（已否决）

- **CSS-in-JS (styled-components)**: 需要改写所有组件样式，无法复用 v1.0 的 CSS 变量定义
- **Tailwind dark: 模式**: 需要把 1500 行声明式 CSS 全部改写为 utility class，迁移成本过高

---

## 7. 响应式布局

### 7.1 方案: CSS Media Queries 主力 + 极少 JS 辅助

黄金法则: **能用 CSS 解决的，不用 JS**。

### 7.2 断点体系（与 v1.0 一致）

| 断点 | 侧边栏 | 底部导航 | 宠物位置 |
|------|--------|---------|----------|
| <768px (移动端) | `display:none` | `display:flex` | ChatPage 内 |
| 768-1024px (平板) | `display:flex`, 150px | `display:none` | Sidebar 内 |
| ≥1024px (PC) | `display:flex`, 200px | `display:none` | Sidebar 内 |

### 7.3 JS 辅助场景

仅在 `<PetAvatar>` 需要条件渲染不同 DOM 位置时使用 JS：

```typescript
// hooks/useMediaQuery.ts
function useMediaQuery(query: string): boolean { /* matchMedia listener */ }

// 使用
const isMobile = useMediaQuery('(max-width: 767px)');
// isMobile ? <PetAvatar in ChatPage> : <PetAvatar in Sidebar>
```

### 7.4 CSS 文件组织

```
src/styles/
  themes.css        ← 三主题 CSS 变量（从 v1.0 Part 0 迁移）
  global.css        ← 重置、基础排版、字体
  responsive.css    ← 媒体查询（从 v1.0 Part 10 迁移）
  animations.css    ← 9 个关键帧动画（从 v1.0 Part 9 迁移）
```

### 7.5 备选方案（已否决）

- **Tailwind CSS**: breakpoint 体系强大但迁移成本高，不适合本项目的动画和特效

---

## 8. 迁移风险点 & 应对

| # | 风险 | 等级 | v1.0 现状 | 应对措施 |
|---|------|------|-----------|----------|
| 1 | 聊天缓存格式不兼容 | 🔴 高 | innerHTML 字符串 (`xianxian_chatcache_*`) | v2.0 用 JSON `ChatMessage[]`。添加迁移层：读取旧 key → JSON.parse 失败 → 清空并从 `/history` 重新拉取 |
| 2 | localStorage key 兼容 | 🟡 中 | 6 个 key（token, theme, persona, server, chatcache_*） | v2.0 **直接复用相同 key 名**，用户升级时无需重新登录。token 和 theme key 不变 |
| 3 | JWT 解码 | 🟡 中 | `atob()` 手写解码 | 封装到 `utils/jwt.ts`，相同逻辑。不引入 `jwt-decode` 库（只读 payload，不做验签） |
| 4 | API 调用方式 | 🟢 低 | `XMLHttpRequest` | 替换为 axios，请求格式不变。添加拦截器：401 → logout，429 → Toast + 倒计时 |
| 5 | CSS 动画迁移 | 🟢 低 | 9 个 `@keyframes` in `<style>` | 直接复制到 `styles/animations.css`。React `className` 切换 ≈ v1.0 `classList.toggle` |
| 6 | Emoji 渲染 | 🟢 低 | 系统字体 | 跨框架一致，无风险 |
| 7 | 移动端滚动 | 🟡 中 | 原生 `scrollTop` | 改用 `useRef` + `scrollIntoView`。键盘弹出视口调整用 `visualViewport` API |
| 8 | 速率限制 | 🟢 低 | 已实现 429 处理 | 直接在 axios 拦截器实现，逻辑不变 |

---

## 9. 依赖清单

### 9.1 生产依赖

| 包 | 版本 | 用途 |
|----|------|------|
| react | ^19.2.6 | UI 框架 |
| react-dom | ^19.2.6 | React DOM |
| react-router-dom | ^7.x | 路由管理 |
| axios | ^1.x | HTTP 请求 |
| zustand | ^5.x | 聊天/人格状态管理 |

### 9.2 开发依赖

| 包 | 版本 | 用途 |
|----|------|------|
| typescript | ~6.0.2 | 类型系统 |
| vite | ^8.0.12 | 构建工具 |
| @vitejs/plugin-react | ^6.0.1 | Vite React 插件 |
| eslint | ^10.3.0 | 代码检查 |
| @types/react | ^19.2.14 | React 类型 |
| @types/react-dom | ^19.2.3 | React DOM 类型 |

---

## 10. 文件结构（目标）

```
xianxian-ai-v2/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── BottomNav.tsx
│   │   ├── PetAvatar.tsx
│   │   ├── ChatMessages.tsx
│   │   ├── ChatInput.tsx
│   │   ├── EmojiPicker.tsx
│   │   ├── PersonaCard.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── Toast.tsx
│   │   ├── Modal.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── PersonaPage.tsx
│   │   └── MePage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── useMediaQuery.ts
│   ├── stores/
│   │   ├── chatStore.ts
│   │   └── personaStore.ts
│   ├── services/
│   │   └── api.ts            ← axios 实例 + 拦截器
│   ├── types/
│   │   ├── shared-types.ts   ← Persona, ChatMessage, User（已创建）
│   │   ├── api-types.ts      ← API 响应类型
│   │   └── theme.ts
│   ├── utils/
│   │   ├── jwt.ts            ← JWT 解码工具
│   │   └── storage.ts        ← localStorage 工具
│   ├── styles/
│   │   ├── themes.css        ← 三主题 CSS 变量
│   │   ├── global.css        ← 重置 + 基础排版
│   │   ├── responsive.css    ← 媒体查询
│   │   └── animations.css    ← 9 个关键帧动画
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```
