import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  UserMinus,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  FileText,
  Clock,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { getAdminReports, resolveReport, toggleSuspendUser } from '../../api/reports';
import { AccountReport } from '../../types';
import TopBar from '../../components/layout/TopBar';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AccountReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING');
  const [selectedReport, setSelectedReport] = useState<AccountReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminReports();
      setReports(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Failed to fetch reports. Please verify you have admin permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  // Suspend / Reactivate account (Reversible process)
  const handleToggleSuspend = async (reportedUser: any) => {
    if (!window.confirm(`Are you sure you want to ${reportedUser.is_active ? 'suspend' : 'reactivate'} the account for ${reportedUser.email}?`)) {
      return;
    }
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      const res = await toggleSuspendUser(reportedUser.id);
      
      // Update local report data to reflect user status change
      setReports((prev) =>
        prev.map((r) => {
          if (r.reported_user.id === reportedUser.id) {
            return {
              ...r,
              reported_user: {
                ...r.reported_user,
                is_active: res.is_active,
              },
            };
          }
          return r;
        })
      );

      // Update selected report if opened
      if (selectedReport && selectedReport.reported_user.id === reportedUser.id) {
        setSelectedReport((prev: any) => ({
          ...prev,
          reported_user: {
            ...prev.reported_user,
            is_active: res.is_active,
          },
        }));
      }

      setActionSuccess(res.detail);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle account suspension.');
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve / Dismiss report
  const handleResolveReport = async (reportId: string, newStatus: 'RESOLVED' | 'DISMISSED') => {
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      await resolveReport(reportId, newStatus);
      
      // Update local status
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );

      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport((prev: any) => ({
          ...prev,
          status: newStatus,
        }));
      }

      setActionSuccess(`Report has been marked as ${newStatus.toLowerCase()}.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resolve report.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <TopBar />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <Shield className={styles.adminIcon} size={28} />
            <div>
              <h1 className={styles.title}>Admin Security Dashboard</h1>
              <p className={styles.subtitle}>
                Review security reports, investigate evidence/screenshots, and moderate accounts.
              </p>
            </div>
          </div>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {actionSuccess && <div className={styles.successAlert}>{actionSuccess}</div>}

        <div className={styles.dashboardGrid}>
          {/* Left panel: Reports list */}
          <div className={styles.reportsPanel}>
            <div className={styles.filterBar}>
              {(['PENDING', 'RESOLVED', 'DISMISSED', 'ALL'] as const).map((opt) => (
                <button
                  key={opt}
                  className={`${styles.filterTab} ${filter === opt ? styles.activeTab : ''}`}
                  onClick={() => setFilter(opt)}
                >
                  {opt.charAt(0) + opt.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={styles.loadingSpinner}>Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className={styles.emptyReports}>
                <Check className={styles.checkIcon} size={36} />
                <p>No reports found in this view.</p>
              </div>
            ) : (
              <div className={styles.reportsList}>
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className={`${styles.reportCard} ${
                      selectedReport?.id === report.id ? styles.selectedCard : ''
                    }`}
                    onClick={() => {
                      setSelectedReport(report);
                      setActionSuccess('');
                    }}
                  >
                    <div className={styles.cardHeader}>
                      <span className={`${styles.badge} ${styles[report.status.toLowerCase()]}`}>
                        {report.status}
                      </span>
                      <span className={styles.cardTime}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={styles.cardReason}>{report.reason}</p>
                    <p className={styles.cardSummary}>
                      Reported: <strong>{report.reported_user.first_name} {report.reported_user.last_name}</strong>
                    </p>
                    <div className={styles.cardFooter}>
                      <span className={styles.reporterEmail}>By: {report.reporter.email}</span>
                      <span className={styles.viewLink}>
                        View Details <Eye size={12} style={{ marginLeft: 4 }} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Details & Moderation actions */}
          <div className={styles.detailsPanel}>
            {selectedReport ? (
              <div className={styles.detailsContent}>
                <div className={styles.detailsHeader}>
                  <div className={styles.detailsTitleRow}>
                    <ShieldAlert size={20} className={styles.alertIcon} />
                    <h2>Report Details</h2>
                  </div>
                  <span className={`${styles.badge} ${styles[selectedReport.status.toLowerCase()]}`}>
                    {selectedReport.status}
                  </span>
                </div>

                <div className={styles.section}>
                  <h3>Reason</h3>
                  <div className={styles.reasonText}>{selectedReport.reason}</div>
                </div>

                <div className={styles.section}>
                  <h3>Evidence / Violation Description</h3>
                  <div className={styles.evidenceBox}>{selectedReport.evidence}</div>
                </div>

                {selectedReport.screenshot ? (
                  <div className={styles.section}>
                    <h3>Screenshot / Image Evidence</h3>
                    <div className={styles.screenshotContainer}>
                      <img
                        src={selectedReport.screenshot}
                        alt="Violation Screenshot"
                        className={styles.screenshotImage}
                      />
                      <a
                        href={selectedReport.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.screenshotLink}
                      >
                        Open original screenshot in new tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className={styles.section}>
                    <h3>Screenshot / Image Evidence</h3>
                    <div className={styles.noScreenshot}>
                      <FileText size={16} /> No screenshot provided with this report.
                    </div>
                  </div>
                )}

                <div className={styles.splitRow}>
                  <div className={styles.userColumn}>
                    <h4>Reporter</h4>
                    <p className={styles.userName}>
                      {selectedReport.reporter.first_name} {selectedReport.reporter.last_name}
                    </p>
                    <p className={styles.userEmail}>{selectedReport.reporter.email}</p>
                    <span className={styles.userRoleBadge}>{selectedReport.reporter.role}</span>
                  </div>

                  <div className={styles.userColumn}>
                    <h4>Reported User</h4>
                    <p className={styles.userName}>
                      {selectedReport.reported_user.first_name} {selectedReport.reported_user.last_name}
                    </p>
                    <p className={styles.userEmail}>{selectedReport.reported_user.email}</p>
                    <div className={styles.reportedStatusRow}>
                      <span className={styles.userRoleBadge}>{selectedReport.reported_user.role}</span>
                      <span
                        className={`${styles.userActiveBadge} ${
                          selectedReport.reported_user.is_active ? styles.activeUser : styles.suspendedUser
                        }`}
                      >
                        {selectedReport.reported_user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Actions Panel */}
                <div className={styles.actionsPanel}>
                  <h3>Moderation Actions</h3>
                  <div className={styles.actionsGrid}>
                    <button
                      className={`${styles.actionBtn} ${
                        selectedReport.reported_user.is_active ? styles.suspendBtn : styles.reactivateBtn
                      }`}
                      onClick={() => handleToggleSuspend(selectedReport.reported_user)}
                      disabled={actionLoading}
                    >
                      {selectedReport.reported_user.is_active ? (
                        <>
                          <UserMinus size={16} /> Suspend Account
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} /> Reactivate Account
                        </>
                      )}
                    </button>

                    {selectedReport.status === 'PENDING' && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.resolveBtn}`}
                          onClick={() => handleResolveReport(selectedReport.id, 'RESOLVED')}
                          disabled={actionLoading}
                        >
                          <Check size={16} /> Resolve Report
                        </button>

                        <button
                          className={`${styles.actionBtn} ${styles.dismissBtn}`}
                          onClick={() => handleResolveReport(selectedReport.id, 'DISMISSED')}
                          disabled={actionLoading}
                        >
                          <X size={16} /> Dismiss Report
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.detailsPlaceholder}>
                <AlertTriangle size={32} />
                <p>Select a report from the list to view evidence and moderate the user.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
