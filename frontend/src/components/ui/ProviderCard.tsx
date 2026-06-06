import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceListing } from '../../types';
import StarRating from './StarRating';
import SaveButton from './SaveButton';
import styles from './ProviderCard.module.css';

interface Props {
  listing: ServiceListing;
  variant?: 'grid' | 'list';
}

export default function ProviderCard({ listing, variant = 'grid' }: Props) {
  const navigate = useNavigate();
  const provider = listing.provider;
  const initials = `${provider.first_name?.[0] || ''}${provider.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className={`card ${styles.card} ${variant === 'list' ? styles.list : ''}`}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.body}>
        <p className={styles.name}>{provider.first_name} {provider.last_name}</p>
        <p className={styles.category} style={{ color: 'var(--color-primary)' }}>{listing.category.name}</p>
        <div className={styles.rating}>
          <StarRating value={Math.round(listing.average_rating || 0)} />
          <span className={styles.ratingNum}>{Number(listing.average_rating || 0).toFixed(1)}</span>
          <span className={styles.ratingCount}>({listing.total_reviews || 0})</span>
        </div>
        <div className={styles.location}>
          <MapPin size={12} />
          <span>{provider.location || listing.service_area}</span>
        </div>
        {variant === 'list' && (
          <p className={styles.description}>{listing.description}</p>
        )}
        <div className={styles.btnRow}>
          <button className={styles.btn} onClick={() => navigate(`/providers/${provider.id}`)}
            style={{ flex: 1 }}>
            View Profile
          </button>
          <SaveButton serviceId={listing.id} showLabel />
        </div>
      </div>
    </div>
  );
}
