import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Phone, MessageSquare, CheckCircle, ChevronLeft, CalendarCheck } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import StarRating from '../../components/ui/StarRating';
import Skeleton from '../../components/ui/Skeleton';
import SaveButton from '../../components/ui/SaveButton';
import { servicesApi } from '../../api/services';
import { reviewsApi } from '../../api/reviews';
import { messagingApi } from '../../api/messaging';
import { bookingsApi } from '../../api/bookings';
import { formatDistanceToNow } from 'date-fns';
import styles from './ProviderProfilePage.module.css';

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['providerProfile', id],
    queryFn: () => servicesApi.getProviderProfile(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['providerReviews', id],
    queryFn: () => reviewsApi.getProviderReviews(id!).then(r => r.data),
    enabled: !!id,
  });

  const handleMessage = async () => {
    try {
      const { data } = await messagingApi.createOrGetConversation(id!);
      navigate(`/messages/${data.id}`);
    } catch {
      navigate('/messages');
    }
  };

  if (isLoading) return (
    <div>
      <TopBar />
      <div className={styles.content}>
        <Skeleton height="200px" radius="10px" />
      </div>
    </div>
  );

  if (!profile) return (
    <div>
      <TopBar />
      <div className={styles.content}>
        <p className={styles.empty}>Provider not found.</p>
      </div>
    </div>
  );

  const user = profile.user;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  const rating = profile.provider_profile?.cached_rating || 0;
  const reviewCount = profile.provider_profile?.cached_review_count || 0;
  const isAvailable = profile.provider_profile?.is_available;

  const reviewResults = reviews?.results || [];
  const dist = [5,4,3,2,1].map(n => ({
    star: n,
    count: reviewResults.filter((r: any) => r.rating === n).length,
  }));
  const maxDist = Math.max(...dist.map(d => d.count), 1);

  return (
    <div>
      <TopBar />
      <div className={styles.content}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back
        </button>

        <div className={styles.grid}>
          {/* Left column */}
          <div className={styles.leftCol}>
            <div className={`card ${styles.profileCard}`}>
              <div className={styles.avatarLg}>{initials}</div>
              <h1 className={styles.name}>{user.first_name} {user.last_name}</h1>
              <p className={styles.catLabel} style={{ color: 'var(--color-primary)' }}>
                {profile.services?.[0]?.category?.name || 'Service Provider'}
              </p>
              <div className={styles.ratingRow}>
                <StarRating value={Math.round(rating)} size={16} />
                <span className={styles.ratingNum}>{Number(rating).toFixed(1)}</span>
                <span className={styles.ratingCount}>({reviewCount} reviews)</span>
              </div>
              <div className={styles.locationRow}>
                <MapPin size={14} />
                <span>{user.location || 'Umoja'}</span>
              </div>
              <div className={`${styles.availBadge} ${isAvailable ? styles.available : styles.unavailable}`}>
                <span className={styles.availDot} />
                {isAvailable ? 'Available' : 'Unavailable'}
              </div>

              <div className={styles.actionBtns}>
                {user.phone && (
                  <a href={`tel:${user.phone}`} className={styles.btnOutline}>
                    <Phone size={15} /> Call
                  </a>
                )}
                <button className={styles.btnPrimary} onClick={handleMessage}>
                  <MessageSquare size={15} /> Message
                </button>
                {profile.services?.[0] && (
                  <SaveButton serviceId={profile.services[0].id} size={15} showLabel />
                )}
              </div>

              {/* Book Service button */}
              {isAvailable && (
                <button
                  className={styles.btnBookService}
                  onClick={() => setBookingOpen(true)}
                >
                  <CalendarCheck size={16} /> Book a Service
                </button>
              )}

              {profile.provider_profile?.bio && (
                <div className={styles.about}>
                  <p className={styles.aboutTitle}>About Me</p>
                  <p className={styles.aboutText}>{profile.provider_profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className={styles.rightCol}>
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}>Services Offered</h2>
              <ul className={styles.serviceList}>
                {(profile.services || []).map((s: any) => (
                  <li key={s.id} className={styles.serviceItem}>
                    <CheckCircle size={14} style={{ color: 'var(--color-confirmed)', flexShrink: 0 }} />
                    <span>{s.title}</span>
                    {s.price_kes && (
                      <span className={styles.servicePrice}>
                        KSh {Number(s.price_kes).toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
                {!profile.services?.length && (
                  <p className={styles.empty}>No services listed yet.</p>
                )}
              </ul>
            </div>

            <div className={`card ${styles.section}`}>
              <div className={styles.reviewHeader}>
                <h2 className={styles.sectionTitle}>Customer Reviews</h2>
                <div className={styles.ratingBig}>
                  <span className={styles.ratingBigNum}>{Number(rating).toFixed(1)}</span>
                  <div>
                    <StarRating value={Math.round(rating)} size={16} />
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {reviewCount} reviews
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.distBars}>
                {dist.map(({ star, count }) => (
                  <div key={star} className={styles.distRow}>
                    <span className={styles.distStar}>{star}★</span>
                    <div className={styles.distTrack}>
                      <div
                        className={styles.distFill}
                        style={{ width: `${(count / maxDist) * 100}%` }}
                      />
                    </div>
                    <span className={styles.distCount}>{count}</span>
                  </div>
                ))}
              </div>

              <div className={styles.reviewList}>
                {reviewResults.slice(0, 5).map((review: any) => (
                  <div key={review.id} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewerAvatar}>
                        {review.reviewer.first_name?.[0]}{review.reviewer.last_name?.[0]}
                      </div>
                      <div>
                        <p className={styles.reviewerName}>
                          {review.reviewer.first_name} {review.reviewer.last_name}
                        </p>
                        <StarRating value={review.rating} size={12} />
                      </div>
                      <p className={styles.reviewTime}>
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                  </div>
                ))}
                {!reviewResults.length && (
                  <p className={styles.empty}>No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {bookingOpen && (
        <BookingModal
          services={profile.services || []}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => navigate('/bookings')}
        />
      )}
    </div>
  );
}

// ── BookingModal ──────────────────────────────────────────────────────────────

function BookingModal({
  services,
  onClose,
  onSuccess,
}: {
  services: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Default datetime to tomorrow 09:00
  const defaultDt = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  })();

  const mutation = useMutation({
    mutationFn: () =>
      bookingsApi.createBooking({
        service_id: serviceId,
        scheduled_at: scheduledAt || defaultDt,
        notes: notes.trim() || undefined,
      }),
    onSuccess,
    onError: (err: any) => {
      const d = err.response?.data;
      setError(
        d?.detail || d?.non_field_errors?.[0] ||
        Object.values(d || {}).flat().join(' ') ||
        'Failed to create booking.'
      );
    },
  });

  return (
    <div className={styles.overlay}>
      <div className={`card ${styles.modal}`}>
        <h2 className={styles.modalTitle}>Book a Service</h2>
        <p className={styles.modalSub}>Choose a service and pick a date & time.</p>

        {error && <div className={styles.modalError}>{error}</div>}

        <div className={styles.modalForm}>
          <label className={styles.modalLabel}>
            Service
            <select
              className={styles.modalInput}
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
            >
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.title}{s.price_kes ? ` — KSh ${Number(s.price_kes).toLocaleString()}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.modalLabel}>
            Date & Time
            <input
              type="datetime-local"
              className={styles.modalInput}
              value={scheduledAt || defaultDt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </label>

          <label className={styles.modalLabel}>
            Notes <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
            <textarea
              className={styles.modalTextarea}
              placeholder="Any specific requirements..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </label>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onClose}>Cancel</button>
          <button
            className={styles.modalBtnSubmit}
            onClick={() => mutation.mutate()}
            disabled={!serviceId || mutation.isPending}
          >
            {mutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
