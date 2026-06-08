import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutContext } from './LayoutContext';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [collapsed,   setCollapsed]       = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleMenuClick       = () => setSidebarOpen(v => !v);
  const handleToggleCollapse  = () => setCollapsed(v => !v);

  return (
    <LayoutContext.Provider value={{
      onMenuClick:      handleMenuClick,
      collapsed,
      onToggleCollapse: handleToggleCollapse,
    }}>
      <div className={styles.shell}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
        />

        {/* Backdrop — visible only on mobile when drawer is open */}
        {sidebarOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content — margin shifts based on sidebar mode */}
        <div
          className={styles.main}
          data-collapsed={collapsed ? 'true' : 'false'}
        >
          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
