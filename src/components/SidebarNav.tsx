import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navConfig';
import { PetAvatar } from './PetAvatar';

export function SidebarNav() {
  return (
    <nav className="sidebar" style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-soft)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      transition: 'width 0.3s ease',
    }}>
      {/* Brand */}
      <div style={{
        padding: '24px 16px 20px', textAlign: 'center',
        fontSize: 20, fontFamily: "'ZCOOL KuaiLe', cursive",
        color: 'var(--text)',
      }}>
        先贤智在
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 15,
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
              background: isActive ? 'var(--card)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Pet avatar — centered in remaining space, matching v1.0 .sidebar-pet */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 12px 40px',
        gap: 8,
      }}>
        <PetAvatar />
      </div>
    </nav>
  );
}
