import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import {
  LayoutDashboard, Search, CalendarDays, MessageSquare,
  Bookmark, User, Settings, LogOut, Briefcase, DollarSign, Users,
  Sun, Moon, X
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const nav = user?.role === 'PROVIDER' ? providerNav : clientNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      aria-label="Main navigation"
    >
      {/* ── Logo / Brand ── */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}><Users size={20} /></div>
        <span className={styles.logoText}>Community Skills<br />Directory</span>

        {/* Close button — only shown on mobile drawer */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Main nav ── */}
      <nav className={styles.nav}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} className={styles.navIcon} />
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div className={styles.bottom}>
        {bottomNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} className={styles.navIcon} />
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}

        {/* Dark mode toggle */}
        <button
          className={`${styles.navItem} ${styles.themeToggle}`}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark'
            ? <Sun size={18} className={styles.navIcon} />
            : <Moon size={18} className={styles.navIcon} />
          }
          <span className={styles.navLabel}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User footer */}
        <div className={styles.userFooter} title={`${user?.first_name} ${user?.last_name}`}>
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

        <button
          className={`${styles.navItem} ${styles.logoutBtn}`}
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={18} className={styles.navIcon} />
          <span className={styles.navLabel}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
