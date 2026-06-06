import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import {
  LayoutDashboard, Search, CalendarDays, MessageSquare,
  Bookmark, User, Settings, LogOut, Briefcase, DollarSign, Users,
  Sun, Moon
} from 'lucide-react';
import styles from './Sidebar.module.css';

const clientNav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search',     icon: Search,          label: 'Search Services' },
  { to: '/bookings',   icon: CalendarDays,    label: 'My Bookings' },
  { to: '/messages',   icon: MessageSquare,   label: 'Messages' },
  { to: '/saved',      icon: Bookmark,        label: 'Saved Providers' },
];

const providerNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-services', icon: Briefcase,       label: 'My Services' },
  { to: '/bookings',    icon: CalendarDays,    label: 'Bookings' },
  { to: '/earnings',    icon: DollarSign,      label: 'Earnings' },
  { to: '/messages',    icon: MessageSquare,   label: 'Messages' },
];

const bottomNav = [
  { to: '/profile',  icon: User,     label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const nav = user?.role === 'PROVIDER' ? providerNav : clientNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}><Users size={20} /></div>
        <span className={styles.logoText}>Community Skills<br />Directory</span>
      </div>

      <nav className={styles.nav}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        {bottomNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        ))}

        {/* Dark mode toggle */}
        <button
          className={`${styles.navItem} ${styles.themeToggle}`}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className={styles.userFooter}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.first_name} {user?.last_name}
            </span>
            <span className={styles.userRole}>
              {user?.role === 'PROVIDER' ? 'Service Provider' : 'Client'}
            </span>
          </div>
        </div>

        <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
          <LogOut size={18} /><span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
