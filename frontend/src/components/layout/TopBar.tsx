import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import styles from './TopBar.module.css';

interface Props {
  searchVisible?: boolean;
}

export default function TopBar({ searchVisible = true }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.greet}>
        <h1 className={styles.title}>Welcome, {user?.first_name || 'there'}!</h1>
        <p className={styles.subtitle}>Find trusted local service providers in Umoja.</p>
      </div>

      {searchVisible && (
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search for a service (e.g., plumber, tailor)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) navigate(`/search?q=${encodeURIComponent(val)}`);
              }
            }}
          />
          <button
            className={styles.searchBtn}
            onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
              if (input?.value) navigate(`/search?q=${encodeURIComponent(input.value)}`);
            }}
          >
            Search
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.bell}><Bell size={18} /></button>

        {/* Clickable avatar with dropdown */}
        <div className={styles.avatarWrap} ref={dropRef}>
          <button
            className={styles.avatar}
            onClick={() => setDropdownOpen(v => !v)}
            aria-label="Account menu"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropHeader}>
                <p className={styles.dropName}>{user?.first_name} {user?.last_name}</p>
                <p className={styles.dropEmail}>{user?.email}</p>
                <span className={styles.dropRole}>{user?.role}</span>
              </div>
              <button
                className={styles.dropItem}
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
              >
                <User size={15} /> View Profile
              </button>
              <button
                className={`${styles.dropItem} ${styles.dropItemDanger}`}
                onClick={handleLogout}
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

