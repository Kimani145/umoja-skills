import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, MapPin, Contact } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Skeleton from '../../components/ui/Skeleton';
import StarRating from '../../components/ui/StarRating';
import SaveButton from '../../components/ui/SaveButton';
import { servicesApi } from '../../api/services';
import { messagingApi } from '../../api/messaging';
import { ServiceListing } from '../../types';
import styles from './SearchPage.module.css';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [area, setArea] = useState(params.get('area') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const p: Record<string, string> = {};
    if (debouncedSearch) p.q = debouncedSearch;
    if (category) p.category = category;
    if (area) p.area = area;
    setParams(p, { replace: true });
  }, [debouncedSearch, category, area]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => servicesApi.getCategories().then(r => r.data),
  });
  const categories = categoriesData?.results || [];

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['services', debouncedSearch, category, area],
    queryFn: () => servicesApi.getServices({
      search: debouncedSearch || undefined,
      category: category || undefined,
      service_area: area || undefined,
    }).then(r => r.data),
  });

  const handleContact = async (providerId: string) => {
    try {
      const { data } = await messagingApi.createOrGetConversation(providerId);
      navigate(`/messages/${data.id}`);
    } catch {
      navigate('/messages');
    }
  };

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        {/* Filters */}
        <div className={`card ${styles.filters}`}>
          <SlidersHorizontal size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            className={styles.filterInput}
            placeholder="Search service or provider name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <div className={styles.areaWrap}>
            <MapPin size={14} />
            <input
              className={styles.areaInput}
              placeholder="Service area..."
              value={area}
              onChange={e => setArea(e.target.value)}
            />
          </div>
        </div>

        {/* Results header */}
        <div className={styles.resultsHeader}>
          {isLoading ? (
            <Skeleton width="120px" height="16px" />
          ) : (
            <p className={styles.resultCount}>
              <strong>{results?.count ?? 0}</strong> results found
              {debouncedSearch && <> for "<em>{debouncedSearch}</em>"</>}
            </p>
          )}
        </div>

        {/* Results */}
        {isLoading && (
          <div className={styles.list}>
            {[1,2,3,4].map(i => (
              <div key={i} className={`card ${styles.skeletonRow}`}>
                <Skeleton width="64px" height="64px" radius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton width="40%" height="16px" />
                  <Skeleton width="25%" height="13px" />
                  <Skeleton width="60%" height="13px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className={styles.empty}>Failed to load results. Check your connection.</div>
        )}

        {!isLoading && !isError && results?.results.length === 0 && (
          <div className={styles.empty}>
            No providers found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
            <br />Try a different search term or category.
          </div>
        )}

        {!isLoading && (results?.results || []).length > 0 && (
          <div className={styles.list}>
            {results!.results.map(listing => (
              <SearchResultRow
                key={listing.id}
                listing={listing}
                onContact={handleContact}
                onView={() => navigate(`/providers/${listing.provider.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultRow({ listing, onContact, onView }: {
  listing: ServiceListing;
  onContact: (id: string) => void;
  onView: () => void;
}) {
  const p = listing.provider;
  const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className={`card ${styles.resultRow}`}>
      <div className={styles.resultAvatar}>{initials}</div>
      <div className={styles.resultBody}>
        <div className={styles.resultTopRow}>
          <div>
            <p className={styles.resultName}>{p.first_name} {p.last_name}</p>
            <p className={styles.resultCategory} style={{ color: 'var(--color-primary)' }}>
              {listing.category.name}
            </p>
          </div>
          <div className={styles.resultMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <StarRating value={Math.round(listing.average_rating || 0)} size={13} />
              <span className={styles.ratingNum}>{Number(listing.average_rating || 0).toFixed(1)}</span>
              <span className={styles.ratingCount}>({listing.total_reviews || 0} reviews)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)', fontSize: 12 }}>
              <MapPin size={12} />
              <span>{p.location || listing.service_area}</span>
            </div>
          </div>
        </div>
        <p className={styles.resultDesc}>{listing.description}</p>
        {listing.price_kes && (
          <p className={styles.resultPrice}>From KSh {Number(listing.price_kes).toLocaleString()}</p>
        )}
      </div>
      <div className={styles.resultActions}>
        <button className={styles.btnOutline} onClick={onView}>View Profile</button>
        <button className={styles.btnPrimary} onClick={() => onContact(listing.provider.id)}>
          <Contact size={14} /> Contact
        </button>
        <SaveButton serviceId={listing.id} />
      </div>
    </div>
  );
}
