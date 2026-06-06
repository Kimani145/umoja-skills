import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Pencil, ToggleLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import StarRating from '../../components/ui/StarRating';
import Skeleton from '../../components/ui/Skeleton';
import { servicesApi } from '../../api/services';
import { useAuthStore } from '../../store/auth.store';
import styles from './MyServicesPage.module.css';

export default function MyServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myServices', user?.id],
    queryFn: async () => {
      const r = await servicesApi.getServices({});
      return {
        ...r.data,
        results: r.data.results.filter((s: any) => s.provider.id === user?.id),
      };
    },
    enabled: !!user,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deactivateService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myServices'] }),
  });

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>My Services</h1>
          <button className={styles.addBtn} onClick={() => navigate('/my-services/add')}>
            <Plus size={16} /> Add Service
          </button>
        </div>

        {isLoading ? (
          <div className={styles.grid}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <Skeleton height="120px" />
              </div>
            ))}
          </div>
        ) : (data?.results || []).length === 0 ? (
          <div className={styles.empty}>
            <p>You haven't listed any services yet.</p>
            <button className={styles.addBtn} onClick={() => navigate('/my-services/add')}>
              <Plus size={16} /> Add Your First Service
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {(data?.results || []).map((s: any) => (
              <div key={s.id} className={`card ${styles.serviceCard} ${!s.is_active ? styles.inactive : ''}`}>
                <div className={styles.cardHead}>
                  <div>
                    <p className={styles.cardTitle}>{s.title}</p>
                    <p className={styles.cardCategory} style={{ color: 'var(--color-primary)' }}>
                      {s.category.name}
                    </p>
                  </div>
                  {!s.is_active && <span className="badge badge--cancelled">Inactive</span>}
                </div>
                <p className={styles.cardDesc}>{s.description}</p>
                <div className={styles.cardMeta}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <MapPin size={12} /> {s.service_area}
                  </div>
                  {s.price_kes && (
                    <p className={styles.cardPrice}>KSh {Number(s.price_kes).toLocaleString()}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StarRating value={Math.round(s.average_rating || 0)} size={13} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    ({s.total_reviews || 0})
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => navigate(`/my-services/${s.id}/edit`)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  {s.is_active && (
                    <button
                      className={styles.deactivateBtn}
                      onClick={() => deactivateMutation.mutate(s.id)}
                    >
                      <ToggleLeft size={13} /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
