import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/Toast';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { PersonaPage } from './pages/PersonaPage';
import { MePage } from './pages/MePage';
import { useTheme } from './hooks/useTheme';

function FloatingThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const icons: Record<string, string> = { dark: '🌙', light: '☀️', blue: '💧' };
  return (
    <button onClick={cycleTheme} className="theme-toggle" style={{
      position: 'fixed', top: 20, right: 20, zIndex: 1000,
      width: 40, height: 40, borderRadius: '50%',
      background: 'var(--surface)', border: '2px solid var(--border)',
      fontSize: 18, cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(8px)',
      transition: 'all 0.35s',
    }} title="切换主题">
      {icons[theme] || '🌙'}
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <FloatingThemeToggle />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppLayout />}>
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/persona" element={<PersonaPage />} />
                <Route path="/me" element={<MePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
