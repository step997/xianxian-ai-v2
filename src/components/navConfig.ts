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
