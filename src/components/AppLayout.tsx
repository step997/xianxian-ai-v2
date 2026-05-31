import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <ProtectedRoute>
      <div className="app-container" style={{ display: 'flex', minHeight: '100dvh' }}>
        {/* Sidebar: tablet/PC only */}
        {!isMobile && <SidebarNav />}

        <main style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
          paddingBottom: isMobile ? 64 : 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          transition: 'margin-left 0.3s ease',
        }}>
          <Outlet />
        </main>

        {/* Bottom nav: mobile only */}
        {isMobile && <BottomNav />}
      </div>
    </ProtectedRoute>
  );
}
