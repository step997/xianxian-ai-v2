import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navConfig';

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 64,
      background: 'var(--bg-soft)',
      borderTop: '1px solid var(--border)',
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
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2,
            minWidth: 64,
            minHeight: 44,
            color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: isActive ? 700 : 500,
            transition: 'color 0.15s ease',
          })}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
