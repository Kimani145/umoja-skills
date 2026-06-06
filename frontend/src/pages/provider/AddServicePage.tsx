import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import { servicesApi } from '../../api/services';
import styles from './AddServicePage.module.css';

export default function AddServicePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', price_kes: '', service_area: '', category: '',
  });
  const [error, setError] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => servicesApi.getCategories().then(r => r.data),
  });
  const categories = categoriesData?.results || [];

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('service_area', form.service_area);
      fd.append('category_id', form.category);
      if (form.price_kes) fd.append('price_kes', form.price_kes);
      return servicesApi.createService(fd);
    },
    onSuccess: () => navigate('/my-services'),
    onError: (err: any) => {
      const d = err.response?.data;
      const msgs = Object.values(d || {}).flat().join(' ');
      setError(msgs || 'Failed to create service.');
    },
  });

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back to My Services
        </button>
        <h1 className={styles.pageTitle}>Add New Service</h1>

        <div className={`card ${styles.formCard}`}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.form}>
            <div className={styles.row2}>
              <label className={styles.label}>
                Service Name *
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={set('title')}
                  placeholder="e.g. Pipe installation"
                  required
                />
              </label>
              <label className={styles.label}>
                Price (KES) — optional
                <input
                  className={styles.input}
                  type="number"
                  value={form.price_kes}
                  onChange={set('price_kes')}
                  placeholder="e.g. 2500"
                  min={0}
                />
              </label>
            </div>

            <div className={styles.row2}>
              <label className={styles.label}>
                Category *
                <select
                  className={styles.input}
                  value={form.category}
                  onChange={set('category')}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Service Area *
                <input
                  className={styles.input}
                  value={form.service_area}
                  onChange={set('service_area')}
                  placeholder="e.g. Umoja Phase 1"
                  required
                />
              </label>
            </div>

            <label className={styles.label}>
              Description *
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={set('description')}
                placeholder="Describe your service in detail..."
                rows={5}
                required
              />
            </label>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className={styles.btnCancel} onClick={() => navigate('/my-services')}>
                Cancel
              </button>
              <button
                className={styles.btnSave}
                onClick={() => mutation.mutate()}
                disabled={
                  mutation.isPending ||
                  !form.title.trim() ||
                  !form.category ||
                  !form.description.trim() ||
                  !form.service_area.trim()
                }
              >
                {mutation.isPending ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
