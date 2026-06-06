import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ProviderCard from '../../components/ui/ProviderCard';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../api/axios';
import styles from './SavedProvidersPage.module.css';

export default function SavedProvidersPage() {
  const { data: saved, isLoading } = useQuery({
    queryKey: ['savedProviders'],
    queryFn: () => api.get('/saved/').then(r => r.data),
  });

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Saved Providers</h1>

        {isLoading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <Skeleton height="160px" />
              </div>
            ))}
          </div>
        ) : (saved || []).length === 0 ? (
          <div className={styles.empty}>
            <Bookmark size={40} style={{ color: 'var(--color-border)' }} />
            <p>No saved providers yet.</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
              When you browse services, tap the bookmark icon to save providers here.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {saved.map((listing: any) => (
              <ProviderCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
