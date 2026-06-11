import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, ShieldCheck, Upload, X } from 'lucide-react';
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

  // Verification Request states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState<{
    document_type: 'NATIONAL_ID' | 'PASSPORT' | 'BUSINESS_PERMIT';
    document_number: string;
    document_image: File | null;
  }>({
    document_type: 'NATIONAL_ID',
    document_number: '',
    document_image: null,
  });
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVerifyForm(f => ({ ...f, document_image: e.target.files![0] }));
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForm.document_number.trim()) {
      setVerifyError('Document number is required.');
      return;
    }
    setVerifyStatus('submitting');
    setVerifyError('');
    try {
      const formData = new FormData();
      formData.append('document_type', verifyForm.document_type);
      formData.append('document_number', verifyForm.document_number);
      if (verifyForm.document_image) {
        formData.append('document_image', verifyForm.document_image);
      }
      const { data } = await authApi.requestVerification(formData);
      setUser(data.user);
      setVerifyStatus('success');
      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifyStatus('idle');
        setVerifyForm({ document_type: 'NATIONAL_ID', document_number: '', document_image: null });
      }, 2000);
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyError(err.response?.data?.detail || 'Verification submission failed.');
    }
  };


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
            {!user?.is_verified && (
              <button 
                className={styles.verifyBtn}
                onClick={() => setShowVerifyModal(true)}
              >
                Verify Account
              </button>
            )}
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

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>Verify Your Profile</h2>
              <button 
                onClick={() => setShowVerifyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {verifyStatus === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-confirmed)', display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--color-confirmed-bg)' }}>
                  <ShieldCheck size={40} />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Verification Approved!</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0 }}>
                  Your profile has been successfully verified. A checkmark is now visible next to your name.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifySubmit} className={styles.form}>
                <p className={styles.modalSub}>
                  Upload verification credentials to confirm your identity. In this pre-beta environment, verification requests are auto-approved instantly.
                </p>

                {verifyError && <div className={styles.errorMsg}>{verifyError}</div>}

                <label className={styles.label}>
                  Document Type
                  <select 
                    className={styles.input}
                    value={verifyForm.document_type}
                    onChange={e => setVerifyForm(f => ({ ...f, document_type: e.target.value as any }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="NATIONAL_ID">National ID Card</option>
                    <option value="PASSPORT">International Passport</option>
                    <option value="BUSINESS_PERMIT">Business Permit / License</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Document / ID Number
                  <input 
                    className={styles.input}
                    value={verifyForm.document_number}
                    onChange={e => setVerifyForm(f => ({ ...f, document_number: e.target.value }))}
                    placeholder="Enter document number"
                    required
                  />
                </label>

                <label className={styles.label}>
                  Upload Image of Document
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <label 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        padding: '8px 16px', 
                        border: '1px dashed var(--color-border)', 
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        background: 'var(--color-surface-2)'
                      }}
                    >
                      <Upload size={14} />
                      Choose File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {verifyForm.document_image ? verifyForm.document_image.name : 'No file chosen'}
                    </span>
                  </div>
                </label>

                <div className={styles.modalActions}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn} 
                    onClick={() => setShowVerifyModal(false)}
                    disabled={verifyStatus === 'submitting'}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={verifyStatus === 'submitting'}
                  >
                    {verifyStatus === 'submitting' ? 'Verifying...' : 'Submit Verification'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
