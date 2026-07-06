import { useState, useEffect } from 'react';
import { Users, Search, ShieldAlert, CheckCircle, Shield } from 'lucide-react';
import { getAdminUsers, toggleSuspendUser } from '../../api/reports';
import styles from './AdminUserManagementPage.module.css';

interface ManagedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError('Failed to fetch user accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (userId: string, email: string, currentStatus: boolean) => {
    const confirmation = window.confirm(
      `Are you sure you want to ${currentStatus ? 'suspend' : 'reactivate'} the user account for ${email}?`
    );
    if (!confirmation) return;

    try {
      setActionLoading(userId);
      const response = await toggleSuspendUser(userId);
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: response.is_active } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user account status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const emailMatch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = fullName.includes(searchQuery.toLowerCase());
    const matchesSearch = emailMatch || nameMatch;

    if (roleFilter === 'ALL') return matchesSearch;
    if (roleFilter === 'STAFF') return matchesSearch && u.is_staff;
    return matchesSearch && u.role === roleFilter && !u.is_staff;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Users className={styles.icon} size={28} />
          <div>
            <h1 className={styles.title}>User Account Management</h1>
            <p className={styles.subtitle}>View, search, and moderate community account statuses.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="CLIENT">Clients</option>
          <option value="PROVIDER">Providers</option>
          <option value="STAFF">Administrators</option>
        </select>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading accounts...</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Role</th>
                <th>Staff Privilege</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    No user accounts found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={styles.row}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {u.first_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className={styles.name}>
                            {u.first_name} {u.last_name}
                          </div>
                          <div className={styles.email}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[u.role.toLowerCase() + 'Badge']}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.is_staff ? (
                        <span className={styles.staffYes}>
                          <Shield size={14} className={styles.shieldIcon} /> Yes
                        </span>
                      ) : (
                        <span className={styles.staffNo}>No</span>
                      )}
                    </td>
                    <td>
                      {u.is_active ? (
                        <span className={styles.statusActive}>
                          <CheckCircle size={14} className={styles.statusIcon} /> Active
                        </span>
                      ) : (
                        <span className={styles.statusSuspended}>
                          <ShieldAlert size={14} className={styles.statusIcon} /> Suspended
                        </span>
                      )}
                    </td>
                    <td>
                      {u.is_staff ? (
                        <span className={styles.disabledAction} title="Staff cannot be suspended here">
                          Protected
                        </span>
                      ) : (
                        <button
                          className={`${styles.actionBtn} ${
                            u.is_active ? styles.suspendBtn : styles.reactivateBtn
                          }`}
                          onClick={() => handleToggleSuspend(u.id, u.email, u.is_active)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === u.id
                            ? 'Updating...'
                            : u.is_active
                            ? 'Suspend'
                            : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
