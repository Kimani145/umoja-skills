import TopBar from '../../components/layout/TopBar';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Settings</h1>

        <div className={`card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <p className={styles.sectionSub}>
            Email and push notification preferences — coming soon.
          </p>
        </div>

        <div className={`card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Security</h2>
          <p className={styles.sectionSub}>
            Password change and two-factor authentication — coming soon.
          </p>
        </div>

        <div className={`card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Privacy</h2>
          <p className={styles.sectionSub}>
            Data export and account deletion — coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
