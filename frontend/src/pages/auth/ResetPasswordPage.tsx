import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/auth';
import styles from './Auth.module.css';
import rpStyles from './ResetPassword.module.css';

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export default function ResetPasswordPage() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  const strength = getStrength(password);

  // Guard: no token in URL
  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon} />
            <span className={styles.logoLabel}>Umoja Skills</span>
          </div>
          <div className={rpStyles.invalidBox}>
            <AlertCircle size={32} className={rpStyles.alertIcon} />
            <h1 className={rpStyles.invalidTitle}>Invalid reset link</h1>
            <p className={rpStyles.invalidText}>
              This password reset link is missing or malformed.
            </p>
            <Link to="/forgot-password" className={rpStyles.requestNewLink}>
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (strength.score < 2) {
      setError('Please choose a stronger password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.passwordResetConfirm(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'This reset link is invalid or has expired. Please request a new one.'
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

        {success ? (
          /* ── Success state ── */
          <div className={rpStyles.successBox}>
            <div className={rpStyles.successIcon}>
              <CheckCircle size={36} />
            </div>
            <h1 className={rpStyles.successTitle}>Password updated!</h1>
            <p className={rpStyles.successText}>
              Your password has been changed successfully. You can now sign in
              with your new password.
            </p>
            <button
              className={styles.btn}
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => navigate('/login')}
            >
              Go to Sign in
            </button>
          </div>
        ) : (
          /* ── Reset form ── */
          <>
            <h1 className={styles.title}>Set a new password</h1>
            <p className={rpStyles.subtitle}>
              Choose a strong password you haven't used before.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* New password */}
              <label className={styles.label}>
                New password
                <div className={styles.passwordWrap}>
                  <input
                    className={styles.input}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthBar}>
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={styles.strengthSegment}
                          style={{ background: i <= strength.score ? strength.color : undefined }}
                        />
                      ))}
                    </div>
                    <span className={styles.strengthLabel} style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </label>

              {/* Confirm password */}
              <label className={styles.label}>
                Confirm password
                <input
                  className={`${styles.input} ${confirm && confirm !== password ? styles.inputError : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                {confirm && confirm !== password && (
                  <span className={styles.fieldError}>Passwords do not match.</span>
                )}
              </label>

              <button
                className={styles.btn}
                type="submit"
                disabled={loading || !password || !confirm}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>

            <p className={styles.footer}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
