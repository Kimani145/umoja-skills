import { useState } from 'react';
import { User, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { changeAdminPassword } from '../../api/reports';
import styles from './AdminProfilePage.module.css';

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Input validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and password confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as your current password.');
      return;
    }

    try {
      setLoading(true);
      await changeAdminPassword(currentPassword, newPassword);
      setSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <User className={styles.icon} size={28} />
          <div>
            <h1 className={styles.title}>Administrator Profile</h1>
            <p className={styles.subtitle}>View your account details and update your security settings.</p>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Info Card */}
        <div className={styles.infoCard}>
          <div className={styles.avatarBig}>{initials}</div>
          <h2 className={styles.fullName}>
            {user?.first_name} {user?.last_name}
          </h2>
          <span className={styles.roleBadge}>System Administrator</span>
          
          <div className={styles.detailsList}>
            <div className={styles.detailsRow}>
              <span className={styles.detailLabel}>Email Address</span>
              <span className={styles.detailVal}>{user?.email}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailLabel}>Admin Status</span>
              <span className={styles.detailValActive}>Active / Privileged</span>
            </div>
          </div>
        </div>

        {/* Password Card */}
        <div className={styles.passwordCard}>
          <div className={styles.cardHeader}>
            <KeyRound className={styles.cardHeaderIcon} size={20} />
            <h3 className={styles.cardTitle}>Change Account Password</h3>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.successBox}>
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword" className={styles.label}>
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
