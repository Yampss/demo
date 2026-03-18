import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../api';
import Sidebar from '../components/Sidebar';

const NotificationsPage = () => {
  const [data, setData] = useState({ notifications: [], unread_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await notificationAPI.getMy({ limit: 50 });
      setData(res.data.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      loadData();
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      loadData();
    } catch (err) {}
  };

  const deleteNotif = async (id) => {
    try {
      await notificationAPI.delete(id);
      loadData();
    } catch (err) {}
  };

  const typeIcon = { transaction: '💳', loan: '🏦', general: '🔔', system: '⚙️' };
  const typeColor = { transaction: 'var(--accent-green)', loan: 'var(--accent-primary)', general: 'var(--accent-gold)', system: 'var(--text-secondary)' };

  return (
    <div style={styles.pageLayout}>
      <Sidebar active="notifications" />
      <div style={styles.content} className="fade-in">
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Notifications</h1>
            {data.unread_count > 0 && <span className="badge badge-purple">{data.unread_count} unread</span>}
          </div>
          {data.unread_count > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all as read</button>
          )}
        </div>

        {loading ? (
          <div style={styles.center}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : data.notifications.length === 0 ? (
          <div className="card" style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div style={styles.list}>
            {data.notifications.map((notif) => (
              <div key={notif.id} style={{ ...styles.notifCard, ...(!notif.is_read ? styles.unread : {}) }}>
                <div style={{ ...styles.notifIcon, color: typeColor[notif.type] || typeColor.general }}>
                  {typeIcon[notif.type] || typeIcon.general}
                </div>
                <div style={styles.notifBody}>
                  <div style={styles.notifTitle}>{notif.title}</div>
                  <div style={styles.notifMessage}>{notif.message}</div>
                  <div style={styles.notifDate}>{new Date(notif.created_at).toLocaleString()}</div>
                </div>
                <div style={styles.notifActions}>
                  {!notif.is_read && (
                    <button className="btn btn-secondary btn-sm" onClick={() => markRead(notif.id)}>Read</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => deleteNotif(notif.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageLayout: { display: 'flex', minHeight: '100vh' },
  content: { flex: 1, padding: '32px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', marginBottom: '8px' },
  center: { display: 'flex', justifyContent: 'center', padding: '40px' },
  emptyState: { textAlign: 'center', padding: '48px', color: 'var(--text-muted)' },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  notifCard: {
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: '14px', padding: '18px 20px', transition: 'all 0.2s',
  },
  unread: { borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' },
  notifIcon: { fontSize: '24px', flexShrink: 0, marginTop: '2px' },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '4px' },
  notifMessage: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' },
  notifDate: { fontSize: '12px', color: 'var(--text-muted)' },
  notifActions: { display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0 },
};

export default NotificationsPage;
