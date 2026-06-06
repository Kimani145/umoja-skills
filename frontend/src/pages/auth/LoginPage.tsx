import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.user, data.access, data.refresh);
      navigate(params.get('next') || '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon} />
          <span className={styles.logoLabel}>Community Skills Directory</span>
        </div>
        <h1 className={styles.title}>Sign in to your account</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email address
            <input
              className={styles.input}
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" required autoFocus
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </label>
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
