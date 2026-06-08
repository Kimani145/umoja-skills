import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.user, data.access, data.refresh);
      navigate(params.get('next') || '/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon} />
          <span className={styles.logoLabel}>Umoja Skills — Community Directory</span>
        </div>
        <h1 className={styles.title}>Sign in to your account</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email address
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </label>

          <div>
            <label className={styles.label}>
              Password
              <div className={styles.passwordWrap}>
                <input
                  className={styles.input}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </label>
          </div>

          {/* Forgot password link — right-aligned below the field */}
          <div style={{ textAlign: 'right', marginTop: -6 }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}
            >
              Forgot password?
            </Link>
          </div>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
        <p className={styles.footer} style={{ marginTop: 6 }}>
          <Link to="/forgot-password" style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
