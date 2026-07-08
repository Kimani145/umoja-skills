import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth';
import LocationSelector from '../../components/LocationSelector';
import styles from './Auth.module.css';

/* ── Validation helpers ─────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates a Kenyan phone number.
 * Accepts: +2547XXXXXXXX | 07XXXXXXXX | 2547XXXXXXXX
 * Rejects sequential/repeated digit strings (123456789, 111111111, etc.)
 */
function validatePhone(raw: string): string | null {
  if (!raw) return null; // optional field

  const digits = raw.replace(/\D/g, '');

  // Must look like a real Kenyan number
  const kenyanRe = /^(?:254|\+254|0)(7[0-9]{8}|1[0-9]{8})$/;
  if (!kenyanRe.test(raw.trim())) {
    return 'Enter a valid Kenyan number — e.g. 0712 345678 or +254712345678';
  }

  // Reject sequential runs (1234567890, 0987654321)
  const local = digits.slice(-9); // last 9 digits
  const isSequential = (s: string) => {
    let up = 0, down = 0;
    for (let i = 1; i < s.length; i++) {
      if (+s[i] === +s[i - 1] + 1) up++;
      if (+s[i] === +s[i - 1] - 1) down++;
    }
    return up >= 6 || down >= 6;
  };
  // Reject all-same digits (111111111)
  const isRepeated = (s: string) => new Set(s).size <= 2;

  if (isSequential(local) || isRepeated(local)) {
    return 'Phone number looks invalid — please enter a real number.';
  }

  return null;
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Include at least one number.';
  return null;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    role: 'CLIENT' as 'CLIENT' | 'PROVIDER',
  });

  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      // Clear field error on change
      setErrors(prev => ({ ...prev, [k]: '' }));
    };

  const handleLocationChange = useCallback(
    (addr: string) => setForm(f => ({ ...f, location: addr })),
    []
  );

  /* Client-side validation before submit */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim())  errs.last_name  = 'Last name is required.';

    if (!EMAIL_RE.test(form.email)) {
      errs.email = 'Enter a valid email address.';
    }

    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else {
      const phoneErr = validatePhone(form.phone);
      if (phoneErr) errs.phone = phoneErr;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await authApi.register({
        email:      form.email,
        password:   form.password,
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone,
        location:   form.location,
        role:       form.role,
      });

      if (data.access && data.refresh && data.user) {
        setAuth(data.user, data.access, data.refresh);
        navigate('/dashboard');
        return;
      }

      if (data.verification_required && data.challenge_id) {
        setChallengeId(data.challenge_id);
        setVerificationMessage(data.detail);
        return;
      }

      setServerError(data.detail || 'Registration failed. Please try again.');
    } catch (err: any) {
      const d = err.response?.data;
      let msg = 'Registration failed. Please try again.';
      
      // Try to extract any validation error
      if (d?.email?.[0]) msg = d.email[0];
      else if (d?.phone?.[0]) msg = d.phone[0];
      else if (d?.first_name?.[0]) msg = d.first_name[0];
      else if (d?.last_name?.[0]) msg = d.last_name[0];
      else if (d?.password?.[0]) msg = d.password[0];
      else if (d?.detail) msg = d.detail;
      else if (d?.non_field_errors?.[0]) msg = d.non_field_errors[0];
      else if (typeof d === 'string') msg = d;
      
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!challengeId || verificationCode.trim().length !== 6) {
      setServerError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.confirmEmailVerification(challengeId, verificationCode.trim());
      setAuth(data.user, data.access, data.refresh);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Password strength indicator */
  const pwStrength = (() => {
    const pw = form.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
  })();

  const pwStrengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][pwStrength];
  const pwStrengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][pwStrength];

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 520 }}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon} />
          <span className={styles.logoLabel}>Umoja Skills — Community Directory</span>
        </div>
        <h1 className={styles.title}>Create your account</h1>

        {serverError && <div className={styles.error}>{serverError}</div>}
        {verificationMessage && !serverError && <div className={styles.success}>{verificationMessage}</div>}

        <form onSubmit={challengeId ? handleVerificationSubmit : handleSubmit} className={styles.form} noValidate>
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
                {loading ? 'Verifying…' : 'Verify email and continue'}
              </button>
            </>
          ) : (
            <>

          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className={styles.label}>
                First name
                <input
                  className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                  value={form.first_name}
                  onChange={set('first_name')}
                  autoComplete="given-name"
                  required
                />
              </label>
              {errors.first_name && <p className={styles.fieldError}>{errors.first_name}</p>}
            </div>
            <div>
              <label className={styles.label}>
                Last name
                <input
                  className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                  value={form.last_name}
                  onChange={set('last_name')}
                  autoComplete="family-name"
                  required
                />
              </label>
              {errors.last_name && <p className={styles.fieldError}>{errors.last_name}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={styles.label}>
              Email address
              <input
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </label>
            {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className={styles.label}>
              Password
              <div className={styles.passwordWrap}>
                <input
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
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
            {form.password && (
              <div className={styles.strengthRow}>
                <div className={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={styles.strengthSegment}
                      style={{ background: i <= pwStrength ? pwStrengthColor : undefined }}
                    />
                  ))}
                </div>
                <span className={styles.strengthLabel} style={{ color: pwStrengthColor }}>
                  {pwStrengthLabel}
                </span>
              </div>
            )}
            {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={styles.label}>
              Confirm password
              <div className={styles.passwordWrap}>
                <input
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </label>
            {errors.confirmPassword && <p className={styles.fieldError}>{errors.confirmPassword}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className={styles.label}>
              Phone number
              <input
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+254 7XX XXX XXX"
                autoComplete="tel"
                required
              />
            </label>
            {errors.phone
              ? <p className={styles.fieldError}>{errors.phone}</p>
              : <p className={styles.hint}>Kenyan numbers only — e.g. 0712 345678</p>}
          </div>

          {/* Cascading Location */}
          <div>
            <p className={styles.locationLabel}>Your location in Umoja</p>
            <LocationSelector value={form.location} onChange={handleLocationChange} />
            <p className={styles.hint}>
              Select your area, zone, and court so clients can find local providers.
            </p>
          </div>

          {/* Role */}
          <label className={styles.label}>
            I am joining as
            <select className={styles.input} value={form.role} onChange={set('role')}>
              <option value="CLIENT">Client — I'm looking for services</option>
              <option value="PROVIDER">Provider — I offer services</option>
            </select>
          </label>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
            </>
          )}
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
