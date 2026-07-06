import { useState, useEffect } from 'react';
import { History, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { getAdminLogs } from '../../api/reports';
import styles from './AdminActivityLogPage.module.css';

interface ActivityLog {
  id: string;
  admin: string;
  admin_email: string;
  action_type: string;
  target_user: string | null;
  target_user_email: string | null;
  details: string;
  created_at: string;
}

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminLogs();
      setLogs(data);
    } catch (err: any) {
      setError('Failed to fetch activity audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeClass = (actionType: string) => {
    const type = actionType.toUpperCase();
    if (type.includes('SUSPEND')) return styles.badgeSuspend;
    if (type.includes('REACTIVATE')) return styles.badgeReactivate;
    if (type.includes('RESOLVE')) return styles.badgeResolve;
    if (type.includes('DISMISS')) return styles.badgeDismiss;
    if (type.includes('PASSWORD')) return styles.badgePassword;
    return styles.badgeDefault;
  };

  const formatActionName = (actionType: string) => {
    return actionType.replace(/_/g, ' ');
  };

  const filteredLogs = logs.filter((log) => {
    const detailsMatch = log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = log.admin_email.toLowerCase().includes(searchQuery.toLowerCase());
    const targetMatch = log.target_user_email
      ? log.target_user_email.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    const typeMatch = log.action_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearch = detailsMatch || emailMatch || targetMatch || typeMatch;

    if (typeFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.action_type === typeFilter;
  });

  // Extract unique action types for the filter dropdown
  const uniqueTypes = Array.from(new Set(logs.map((l) => l.action_type)));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <History className={styles.icon} size={28} />
          <div>
            <h1 className={styles.title}>System Audit Activity Logs</h1>
            <p className={styles.subtitle}>
              Chronological log of admin operations for system accountability.
            </p>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={fetchLogs} disabled={loading} title="Refresh Logs">
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by admin email, target user, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Action Types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {formatActionName(t)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading activity logs...</p>
        </div>
      ) : (
        <div className={styles.logList}>
          {filteredLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={36} className={styles.emptyIcon} />
              <p>No activity logs found matching the current search parameters.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className={styles.logCard}>
                <div className={styles.logHeader}>
                  <div className={styles.adminInfo}>
                    <span className={styles.adminLabel}>ADMIN</span>
                    <span className={styles.adminEmail}>{log.admin_email}</span>
                  </div>
                  <span className={`${styles.badge} ${getActionBadgeClass(log.action_type)}`}>
                    {formatActionName(log.action_type)}
                  </span>
                </div>
                <div className={styles.logDetails}>{log.details}</div>
                <div className={styles.logFooter}>
                  <span className={styles.timestamp}>
                    {new Date(log.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  {log.target_user_email && (
                    <span className={styles.targetUser}>
                      Target: <strong>{log.target_user_email}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
