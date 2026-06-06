import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth';
import styles from './Auth.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '',
    phone: '', location: '', role: 'CLIENT' as 'CLIENT' | 'PROVIDER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await authApi.register(form);
      setAuth(data.user, data.access, data.refresh);
      navigate('/dashboard');
    } catch (err: any) {
      const d = err.response?.data;
      const msg =
        d?.email?.[0] ||
        d?.first_name?.[0] ||
        d?.password?.[0] ||
        d?.detail ||
        d?.non_field_errors?.[0] ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 480 }}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon} />
          <span className={styles.logoLabel}>Community Skills Directory</span>
        </div>
        <h1 className={styles.title}>Create your account</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className={styles.label}>
              First name
              <input className={styles.input} value={form.first_name} onChange={set('first_name')} required />
            </label>
            <label className={styles.label}>
              Last name
              <input className={styles.input} value={form.last_name} onChange={set('last_name')} required />
            </label>
          </div>
          <label className={styles.label}>
            Email address
            <input className={styles.input} type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className={styles.label}>
            Password
            <input className={styles.input} type="password" value={form.password} onChange={set('password')} required minLength={8} />
          </label>
          <label className={styles.label}>
            Phone number
            <input className={styles.input} type="tel" value={form.phone} onChange={set('phone')} placeholder="+254..." />
          </label>
          <label className={styles.label}>
            Your location (e.g. Umoja Phase 1)
            <input className={styles.input} value={form.location} onChange={set('location')} />
          </label>
          <label className={styles.label}>
            I am joining as
            <select className={styles.input} value={form.role} onChange={set('role')}>
              <option value="CLIENT">Client — I'm looking for services</option>
              <option value="PROVIDER">Provider — I offer services</option>
            </select>
          </label>
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
