import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/auth';
import styles from './Auth.module.css';
import fpStyles from './ForgotPassword.module.css';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.passwordResetRequest(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon} />
          <span className={styles.logoLabel}>Umoja Skills — Community Directory</span>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className={fpStyles.successBox}>
            <div className={fpStyles.successIcon}>
              <CheckCircle size={36} />
            </div>
            <h1 className={fpStyles.successTitle}>Check your inbox</h1>
            <p className={fpStyles.successText}>
              If <strong>{email}</strong> is registered with Umoja Skills, you'll
              receive a password reset link shortly. The link expires in{' '}
              <strong>1 hour</strong>.
            </p>
            <p className={fpStyles.successHint}>
              Didn't get the email? Check your spam folder, or{' '}
              <button
                className={fpStyles.retryLink}
                onClick={() => { setSent(false); setEmail(''); }}
              >
                try again
              </button>
              .
            </p>
            <Link to="/login" className={fpStyles.backBtn}>
              <ArrowLeft size={15} /> Back to Sign in
            </Link>
          </div>
        ) : (
          /* ── Request form ── */
          <>
            <h1 className={styles.title}>Forgot your password?</h1>
            <p className={fpStyles.subtitle}>
              Enter the email address you signed up with and we'll send you a
              link to reset your password.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.label}>
                Email address
                <div className={fpStyles.inputWrap}>
                  <Mail size={16} className={fpStyles.inputIcon} />
                  <input
                    className={`${styles.input} ${fpStyles.inputPadded}`}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </label>

              <button
                className={styles.btn}
                type="submit"
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className={styles.footer}>
              <Link to="/login" className={fpStyles.backLink}>
                <ArrowLeft size={13} style={{ verticalAlign: 'middle' }} />
                {' '}Back to Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
