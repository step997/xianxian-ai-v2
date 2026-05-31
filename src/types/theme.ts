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
