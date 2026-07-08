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
  const [challengeId, setChallengeId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('[LoginPage] Submitting login form', { email, password: '***' });
    try {
      console.log('[LoginPage] Calling authApi.login...');
      const response = await authApi.login(email, password);
      const { data } = response;
      console.log('[LoginPage] Login response received:', {
        status: response.status,
        hasAccess: !!data.access,
        hasRefresh: !!data.refresh,
        hasUser: !!data.user,
        hasChallenge: !!data.challenge_id,
        detail: data.detail,
        dataKeys: Object.keys(data),
      });

      if (data.access && data.refresh && data.user) {
        console.log('[LoginPage] Direct auth - setting auth state and navigating');
        setAuth(data.user, data.access, data.refresh);
        navigate(params.get('next') || '/dashboard');
        return;
      }
      if (data.verification_required && data.challenge_id) {
        console.log('[LoginPage] Email verification required - showing code screen');
        setChallengeId(data.challenge_id);
        setVerificationMessage(data.detail);
        return;
      }
      console.log('[LoginPage] Unexpected response state:', data);
      setError(data.detail || 'Invalid email or password.');
    } catch (err: any) {
      console.error('[LoginPage] Login error:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        url: err.config?.url,
      });
      const d = err.response?.data;
      let msg = 'Invalid email or password.';
      if (d?.detail) msg = d.detail;
      else if (d?.non_field_errors?.[0]) msg = d.non_field_errors[0];
      else if (d?.email?.[0]) msg = d.email[0];
      else if (d?.password?.[0]) msg = d.password[0];
      else msg = err.message || msg;
      console.error('[LoginPage] Final error message:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!challengeId || verificationCode.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.confirmEmailVerification(challengeId, verificationCode.trim());
      setAuth(data.user, data.access, data.refresh);
      navigate(params.get('next') || '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed. Please try again.');
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
        {verificationMessage && !error && <div className={styles.success}>{verificationMessage}</div>}

        <form onSubmit={challengeId ? handleVerificationSubmit : handleSubmit} className={styles.form}>
          {challengeId ? (
            <>
              <label className={styles.label}>
                Confirmation code
                <input
                  className={styles.input}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                />
              </label>

              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify email and sign in'}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
