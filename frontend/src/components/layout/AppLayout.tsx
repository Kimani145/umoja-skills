import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
}
