import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutContext } from './LayoutContext';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleMenuClick = () => setSidebarOpen(v => !v);

  return (
    <LayoutContext.Provider value={{ onMenuClick: handleMenuClick }}>
      <div className={styles.shell}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Backdrop — visible only on mobile when drawer is open */}
        {sidebarOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className={styles.main}>
          {/* TopBar is rendered by each individual page (existing pattern).
              The onMenuClick is provided via LayoutContext so pages can pass it
              to their TopBar without prop-drilling. */}
          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
