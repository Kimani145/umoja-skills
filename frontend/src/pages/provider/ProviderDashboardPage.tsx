import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckSquare, DollarSign, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import StarRating from '../../components/ui/StarRating';
import Skeleton from '../../components/ui/Skeleton';
import { dashboardApi } from '../../api/dashboard';
import { format } from 'date-fns';
import styles from './ProviderDashboard.module.css';

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['providerDashboard'],
    queryFn: () => dashboardApi.getProviderDashboard().then(r => r.data),
  });

  return (
    <div>
      <TopBar />
      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsRow}>
          <StatCard label="Total Bookings" value={isLoading ? '…' : (data?.total_bookings ?? 0)}
            sublabel="All time" icon={CalendarDays} iconColor="#1A56DB" iconBg="#EBF0FF" />
          <StatCard label="Completed Jobs" value={isLoading ? '…' : (data?.completed_jobs ?? 0)}
            sublabel="All time" icon={CheckSquare} iconColor="#057A55" iconBg="#DEF7EC" />
          <StatCard
            label="Total Earnings"
            value={isLoading ? '…' : `KSh ${Number(data?.total_earnings_kes || 0).toLocaleString()}`}
            sublabel="All time" icon={DollarSign} iconColor="#7E3AF2" iconBg="#EDEBFE"
          />
          <StatCard label="Avg. Rating"
            value={isLoading ? '…' : Number(data?.average_rating || 0).toFixed(1)}
            sublabel={`${data?.total_reviews || 0} reviews`}
            icon={Star} iconColor="#C27803" iconBg="#FDF6B2"
          />
        </div>

        <div className={styles.twoCol}>
          {/* Upcoming Bookings */}
          <div className={`card ${styles.section}`}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Upcoming Bookings</h2>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 20px' }}>
                {[1,2,3].map(i => <Skeleton key={i} height="48px" />)}
              </div>
            ) : (data?.upcoming_bookings || []).length === 0 ? (
              <p className={styles.empty}>No upcoming bookings.</p>
            ) : (
              <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Client</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.upcoming_bookings || []).map((booking: any) => (
                    <tr key={booking.id}>
                      <td className={styles.tdService}>{booking.service?.title}</td>
                      <td>{booking.client?.first_name} {booking.client?.last_name}</td>
                      <td>{format(new Date(booking.scheduled_at), 'dd MMM, h:mm a')}</td>
                      <td><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Right side */}
          <div className={styles.rightCol}>
            {/* Add service CTA */}
            <div className={`card ${styles.ctaCard}`}>
              <p className={styles.ctaTitle}>Grow your business</p>
              <p className={styles.ctaSub}>Add a new service to attract more clients.</p>
              <button className={styles.ctaBtn} onClick={() => navigate('/my-services/add')}>
                <Plus size={16} /> Add New Service
              </button>
            </div>

            {/* Recent Reviews */}
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle} style={{ padding: '16px 20px 12px' }}>Recent Reviews</h2>
              {(data?.recent_reviews || []).length === 0 ? (
                <p className={styles.empty}>No reviews yet.</p>
              ) : (
                <div className={styles.reviewList}>
                  {(data?.recent_reviews || []).map((r: any) => (
                    <div key={r.id} className={styles.reviewItem}>
                      <div className={styles.reviewTop}>
                        <p className={styles.reviewerName}>
                          {r.reviewer?.first_name} {r.reviewer?.last_name}
                        </p>
                        <StarRating value={r.rating} size={12} />
                      </div>
                      {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
