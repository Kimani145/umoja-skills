import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: ({ data }) => {
      setUser(data);
      setSuccess(true);
      setError('');
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Update failed.'),
  });

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Profile</h1>

        <div className={styles.grid}>
          {/* Avatar card */}
          <div className={`card ${styles.avatarCard}`}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{initials}</div>
              <button className={styles.cameraBtn} title="Change photo (coming soon)">
                <Camera size={14} />
              </button>
            </div>
            <p className={styles.avatarName}>{user?.first_name} {user?.last_name}</p>
            <p className={styles.avatarRole}>{user?.role === 'PROVIDER' ? 'Service Provider' : 'Client'}</p>
            <p className={styles.avatarEmail}>{user?.email}</p>
            <div className={`${styles.verifiedBadge} ${user?.is_verified ? styles.verified : styles.unverified}`}>
              {user?.is_verified ? '✓ Verified Account' : 'Unverified Account'}
            </div>
          </div>

          {/* Edit form */}
          <div className={`card ${styles.formCard}`}>
            <h2 className={styles.formTitle}>Personal Information</h2>
            <p className={styles.formSub}>Update your name, phone, and location.</p>

            {success && (
              <div className={styles.successMsg}>✓ Profile updated successfully.</div>
            )}
            {error && <div className={styles.errorMsg}>{error}</div>}

            <div className={styles.form}>
              <div className={styles.row2}>
                <label className={styles.label}>
                  First name
                  <input className={styles.input} value={form.first_name} onChange={set('first_name')} />
                </label>
                <label className={styles.label}>
                  Last name
                  <input className={styles.input} value={form.last_name} onChange={set('last_name')} />
                </label>
              </div>
              <label className={styles.label}>
                Email address
                <input className={styles.input} value={user?.email || ''} disabled />
              </label>
              <label className={styles.label}>
                Phone number
                <input className={styles.input} value={form.phone} onChange={set('phone')} placeholder="+254..." />
              </label>
              <label className={styles.label}>
                Location
                <input className={styles.input} value={form.location} onChange={set('location')} placeholder="e.g. Umoja Phase 1" />
              </label>
              <button
                className={styles.saveBtn}
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
