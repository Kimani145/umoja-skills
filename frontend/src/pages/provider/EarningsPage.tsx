import { useQuery } from '@tanstack/react-query';
import TopBar from '../../components/layout/TopBar';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import { DollarSign, TrendingUp, CheckSquare, BarChart2 } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { format } from 'date-fns';
import styles from './EarningsPage.module.css';

export default function EarningsPage() {
  const { data: summary } = useQuery({
    queryKey: ['providerDashboard'],
    queryFn: () => dashboardApi.getProviderDashboard().then(r => r.data),
  });

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['earningsBreakdown'],
    queryFn: () => dashboardApi.getEarningsBreakdown().then(r => r.data),
  });

  const maxMonthly = Math.max(...(earnings?.monthly || []).map((m: any) => m.total_kes), 1);

  return (
    <div>
      <TopBar searchVisible={false} />
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Earnings</h1>

        {/* Stat cards */}
        <div className={styles.statsRow}>
          <StatCard
            label="Total Lifetime Earnings"
            value={`KSh ${Number(earnings?.total_lifetime_kes || 0).toLocaleString()}`}
            sublabel="All completed jobs"
            icon={DollarSign}
            iconColor="#057A55"
            iconBg="#DEF7EC"
          />
          <StatCard
            label="Completed Jobs"
            value={summary?.completed_jobs ?? 0}
            sublabel="All time"
            icon={CheckSquare}
            iconColor="#1A56DB"
            iconBg="#EBF0FF"
          />
          <StatCard
            label="Avg. Earnings / Job"
            value={
              earnings?.breakdown?.length
                ? `KSh ${Math.round(earnings.total_lifetime_kes / earnings.breakdown.length).toLocaleString()}`
                : 'N/A'
            }
            sublabel="Per completed job"
            icon={TrendingUp}
            iconColor="#7E3AF2"
            iconBg="#EDEBFE"
          />
        </div>

        <div className={styles.twoCol}>
          {/* Monthly bar chart */}
          <div className={`card ${styles.section}`}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Monthly Breakdown</h2>
              <BarChart2 size={18} style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {isLoading ? (
              <div style={{ padding: '16px 20px' }}><Skeleton height="160px" /></div>
            ) : (earnings?.monthly || []).length === 0 ? (
              <p className={styles.empty}>No earnings data yet. Complete bookings to see monthly totals.</p>
            ) : (
              <div className={styles.bars}>
                {(earnings?.monthly || []).map((m: any) => (
                  <div key={m.month} className={styles.barRow}>
                    <span className={styles.barLabel}>{m.month}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${(m.total_kes / maxMonthly) * 100}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>KSh {Number(m.total_kes).toLocaleString()}</span>
                    <span className={styles.barJobs}>{m.jobs} job{m.jobs !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-job breakdown table */}
          <div className={`card ${styles.section}`}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Job History</h2>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px' }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height="44px" />)}
              </div>
            ) : (earnings?.breakdown || []).length === 0 ? (
              <p className={styles.empty}>Complete jobs to see your earnings history here.</p>
            ) : (
              <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(earnings?.breakdown || []).map((b: any) => (
                    <tr key={b.id}>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13.5 }}>{b.service_title}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>{b.category}</p>
                      </td>
                      <td style={{ fontSize: 13 }}>{b.client_name}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                        {format(new Date(b.completed_at), 'dd MMM yyyy')}
                      </td>
                      <td>
                        <span className={styles.amount}>
                          {b.amount_kes > 0
                            ? `KSh ${Number(b.amount_kes).toLocaleString()}`
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
