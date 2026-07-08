import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth';
import styles from './AdminLoginPage.module.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      if (data.access && data.refresh && data.user) {
        if (!data.user.is_staff) {
          setError('Access Denied: You do not have administrator privileges.');
          return;
        }
        setAuth(data.user, data.access, data.refresh);
        navigate(params.get('next') || '/admin');
        return;
      }
      if (data.verification_required && data.challenge_id) {
        setChallengeId(data.challenge_id);
        setVerificationMessage(data.detail);
        return;
      }
      setError(data.detail || 'Invalid email or password.');
    } catch (err: any) {
      const d = err.response?.data;
      let msg = 'Invalid email or password.';
      if (d?.detail) msg = d.detail;
      else if (d?.non_field_errors?.[0]) msg = d.non_field_errors[0];
      else if (d?.email?.[0]) msg = d.email[0];
      else if (d?.password?.[0]) msg = d.password[0];
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

      // Perform security check at the client boundary (BFLA)
      if (!data.user.is_staff) {
        setError('Access Denied: You do not have administrator privileges.');
        return;
      }

      setAuth(data.user, data.access, data.refresh);
      navigate(params.get('next') || '/admin');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Shield className={styles.logoIcon} size={36} />
          <h1 className={styles.title}>Admin Security Portal</h1>
          <p className={styles.subtitle}>Sign in with your admin credentials to manage community accounts.</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {verificationMessage && !error && <div className={styles.successBanner}>{verificationMessage}</div>}

        <form onSubmit={challengeId ? handleVerificationSubmit : handleSubmit} className={styles.form}>
          {challengeId ? (
            <>
              <label className={styles.label}>
                Confirmation Code
                <input
                  className={styles.input}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                />
              </label>

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email and Sign In'}
              </button>
            </>
          ) : (
            <>
              <label className={styles.label}>
                Admin Email Address
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@umoja.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </label>

              <label className={styles.label}>
                Password
                <div className={styles.passwordWrap}>
                  <input
                    className={styles.input}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              </button>
            </>
          )}
        </form>

        <div className={styles.footer}>
          <Link to="/login" className={styles.backLink}>
            Return to Community Login
          </Link>
        </div>
      </div>
    </div>
  );
}
