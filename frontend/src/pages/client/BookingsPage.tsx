import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Skeleton from '../../components/ui/Skeleton';
import StarRating from '../../components/ui/StarRating';
import { bookingsApi } from '../../api/bookings';
import { reviewsApi } from '../../api/reviews';
import { Booking } from '../../types';
import { format } from 'date-fns';
import styles from './BookingsPage.module.css';

const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getBookings().then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const filtered = (data?.results || []).filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return ['PENDING', 'CONFIRMED'].includes(b.status);
    return b.status === activeTab;
  });

  return (
    <div>
      <TopBar />
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>My Bookings</h1>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.value}
              className={`${styles.tab} ${activeTab === t.value ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
              {t.value !== 'ALL' && (
                <span className={styles.tabCount}>
                  {(data?.results || []).filter(b =>
                    t.value === 'UPCOMING'
                      ? ['PENDING','CONFIRMED'].includes(b.status)
                      : b.status === t.value
                  ).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.list}>
            {[1,2,3].map(i => (
              <div key={i} className={`card ${styles.row}`}>
                <Skeleton width="52px" height="52px" radius="10px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton width="35%" height="16px" />
                  <Skeleton width="55%" height="13px" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <CalendarDays size={40} style={{ color: 'var(--color-border)', marginBottom: 12 }} />
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(booking => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onCancel={() => cancelMutation.mutate(booking.id)}
                onReview={() => setReviewBookingId(booking.id)}
              />
            ))}
          </div>
        )}
      </div>

      {reviewBookingId && (
        <ReviewModal
          bookingId={reviewBookingId}
          onClose={() => setReviewBookingId(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['bookings'] });
            setReviewBookingId(null);
          }}
        />
      )}
    </div>
  );
}

function BookingRow({ booking, onCancel, onReview }: {
  booking: Booking;
  onCancel: () => void;
  onReview: () => void;
}) {
  const navigate = useNavigate();
  const provider = booking.service?.provider;
  const initials = `${provider?.first_name?.[0] || ''}${provider?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className={`card ${styles.row}`}>
      <div
        className={styles.rowAvatar}
        onClick={() => provider?.id && navigate(`/providers/${provider.id}`)}
        style={{ cursor: 'pointer' }}
        title={`View ${provider?.first_name}'s profile`}
      >
        {initials || '?'}
      </div>
      <div className={styles.rowBody}>
        <p className={styles.rowTitle}>{booking.service?.title || 'Service'}</p>
        <p className={styles.rowProvider}>
          <span
            onClick={() => provider?.id && navigate(`/providers/${provider.id}`)}
            style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }}
          >
            {provider?.first_name} {provider?.last_name}
          </span>
          {booking.service?.service_area && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <MapPin size={11} /> {booking.service.service_area}
            </span>
          )}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <Clock size={12} />
          {format(new Date(booking.scheduled_at), 'dd MMM yyyy, h:mm a')}
        </div>
      </div>
      <div className={styles.rowRight}>
        <StatusBadge status={booking.status} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {booking.status === 'COMPLETED' && !booking.has_review && (
            <button className={styles.btnSm} onClick={onReview}>Leave Review</button>
          )}
          {booking.status === 'PENDING' && (
            <button className={`${styles.btnSm} ${styles.btnDanger}`} onClick={onCancel}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ bookingId, onClose, onSuccess }: {
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => reviewsApi.createReview({ booking_id: bookingId, rating, comment }),
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.detail || 'Failed to submit review.'),
  });

  return (
    <div className={styles.overlay}>
      <div className={`card ${styles.modal}`}>
        <h2 className={styles.modalTitle}>Leave a Review</h2>
        <p className={styles.modalSub}>How was the service?</p>
        <div style={{ margin: '16px 0' }}>
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Share your experience (optional)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
        />
        {error && <p className={styles.errorMsg}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button
            className={styles.btnSubmit}
            onClick={() => mutation.mutate()}
            disabled={rating === 0 || mutation.isPending}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
