import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Skeleton from '../../components/ui/Skeleton';
import { bookingsApi } from '../../api/bookings';
import { Booking } from '../../types';
import { format } from 'date-fns';
import styles from './ProviderBookingsPage.module.css';

const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ProviderBookingsPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['providerBookings'],
    queryFn: () => bookingsApi.getBookings().then(r => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providerBookings'] }),
  });

  const filtered = (data?.results || []).filter(b =>
    activeTab === 'ALL' ? true : b.status === activeTab
  );

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Bookings</h1>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.value}
              className={`${styles.tab} ${activeTab === t.value ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
              <span className={styles.tabCount}>
                {(data?.results || []).filter(b =>
                  t.value === 'ALL' ? true : b.status === t.value
                ).length}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <Skeleton height="60px" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No bookings in this category.</div>
        ) : (
          <div className={styles.list}>
            {filtered.map(booking => (
              <ProviderBookingRow
                key={booking.id}
                booking={booking}
                onConfirm={() => updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })}
                onComplete={() => updateStatus.mutate({ id: booking.id, status: 'COMPLETED' })}
                onCancel={() => updateStatus.mutate({ id: booking.id, status: 'CANCELLED' })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderBookingRow({ booking, onConfirm, onComplete, onCancel }: {
  booking: Booking;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const client = booking.client;
  const initials = `${client?.first_name?.[0] || ''}${client?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className={`card ${styles.row}`}>
      <div className={styles.rowAvatar}>{initials || '?'}</div>
      <div className={styles.rowBody}>
        <p className={styles.rowTitle}>{booking.service?.title || 'Service'}</p>
        <p className={styles.rowClient}>
          Client: {client?.first_name} {client?.last_name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <Clock size={12} />
            {format(new Date(booking.scheduled_at), 'dd MMM yyyy, h:mm a')}
          </div>
          {booking.service?.service_area && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <MapPin size={12} /> {booking.service.service_area}
            </div>
          )}
        </div>
        {booking.notes && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Note: {booking.notes}
          </p>
        )}
      </div>
      <div className={styles.rowRight}>
        <StatusBadge status={booking.status} />
        <div className={styles.actions}>
          {booking.status === 'PENDING' && (
            <>
              <button className={styles.btnConfirm} onClick={onConfirm}>Confirm</button>
              <button className={styles.btnCancel} onClick={onCancel}>Decline</button>
            </>
          )}
          {booking.status === 'CONFIRMED' && (
            <button className={styles.btnComplete} onClick={onComplete}>Mark Complete</button>
          )}
        </div>
      </div>
    </div>
  );
}
