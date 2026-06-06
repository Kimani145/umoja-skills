import { useQuery } from '@tanstack/react-query';
import { Users, Grid, CheckSquare, Star, Wrench, Zap, Scissors, Sparkles, Settings, BookOpen, ChevronRight } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import StatCard from '../../components/ui/StatCard';
import ProviderCard from '../../components/ui/ProviderCard';
import Skeleton from '../../components/ui/Skeleton';
import { dashboardApi } from '../../api/dashboard';
import { servicesApi } from '../../api/services';
import styles from './ClientDashboard.module.css';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_ICONS: Record<string, any> = {
  plumbing: Wrench, electrical: Zap, tailoring: Scissors,
  hairdressing: Sparkles, mechanic: Settings, tutoring: BookOpen,
};

export default function ClientDashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: () => dashboardApi.getClientDashboard().then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => servicesApi.getCategories().then(r => r.data),
  });
  const categories = categoriesData?.results || [];

  return (
    <div>
      <TopBar />
      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsRow}>
          <StatCard label="Service Providers" value={dashLoading ? '…' : (dashboard?.provider_count ?? 0)}
            sublabel="Active providers" icon={Users} iconColor="#1A56DB" iconBg="#EBF0FF" />
          <StatCard label="Services Listed" value={dashLoading ? '…' : (dashboard?.service_count ?? 0)}
            sublabel="Categories" icon={Grid} iconColor="#057A55" iconBg="#DEF7EC" />
          <StatCard label="Completed Jobs" value={dashLoading ? '…' : (dashboard?.completed_jobs_this_month ?? 0)}
            sublabel="This month" icon={CheckSquare} iconColor="#7E3AF2" iconBg="#EDEBFE" />
          <StatCard label="Your Reviews" value={dashLoading ? '…' : (dashboard?.reviews_given ?? 0)}
            sublabel="Reviews given" icon={Star} iconColor="#C27803" iconBg="#FDF6B2" />
        </div>

        <div className={styles.twoCol}>
          <div className={styles.mainCol}>
            {/* Popular Services */}
            <section className="card" style={{ padding: '20px 24px' }}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Popular Services</h2>
                <a href="/search" className={styles.viewAll}>View all <ChevronRight size={14} /></a>
              </div>
              <div className={styles.categories}>
                {(categories || []).slice(0, 6).map(cat => {
                  const Icon = CATEGORY_ICONS[cat.slug] || Wrench;
                  return (
                    <a key={cat.id} href={`/search?category=${cat.slug}`} className={styles.catItem}>
                      <div className={styles.catIcon}><Icon size={22} /></div>
                      <span>{cat.name}</span>
                    </a>
                  );
                })}
              </div>
            </section>

            {/* Recommended Providers */}
            <section>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>Recommended for You</h2>
              {dashLoading ? (
                <div className={styles.providerGrid}>
                  {[1,2,3].map(i => <div key={i} className="card" style={{padding:20}}><Skeleton height="120px" /></div>)}
                </div>
              ) : (
                <div className={styles.providerGrid}>
                  {(dashboard?.recommended_providers || []).map(listing => (
                    <ProviderCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Recent Activities */}
          <aside className={`card ${styles.activityCard}`}>
            <h2 className={styles.sectionTitle} style={{ padding: '20px 20px 12px' }}>Recent Activities</h2>
            <div className={styles.activities}>
              {(dashboard?.recent_activities || []).map(a => (
                <div key={a.id} className={styles.activity}>
                  <div className={styles.activityDot} />
                  <div>
                    <p className={styles.activityText}>{a.text}</p>
                    <p className={styles.activityTime}>
                      {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {(!dashboard?.recent_activities?.length) && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No recent activity.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
