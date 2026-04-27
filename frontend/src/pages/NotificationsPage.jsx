import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const navByRole = {
  student: [
    { label: 'Dashboard', href: '/student-dashboard', icon: '👤' },
    { label: 'My Applications', href: '/my-applications', icon: '📨' },
    { label: 'Interviews', href: '/interviews', icon: '🗓️' },
    { label: 'Notifications', href: '/notifications', icon: '🔔', active: true },
  ],
  company: [
    { label: 'Dashboard', href: '/company-dashboard', icon: '🏢' },
    { label: 'Interviews', href: '/interviews', icon: '🗓️' },
    { label: 'Notifications', href: '/notifications', icon: '🔔', active: true },
  ],
  university_admin: [
    { label: 'Admin Dashboard', href: '/admin-dashboard', icon: '🛡️' },
    { label: 'Interviews', href: '/interviews', icon: '🗓️' },
    { label: 'Notifications', href: '/notifications', icon: '🔔', active: true },
  ],
  system_admin: [
    { label: 'Admin Dashboard', href: '/admin-dashboard', icon: '🛡️' },
    { label: 'Interviews', href: '/interviews', icon: '🗓️' },
    { label: 'Notifications', href: '/notifications', icon: '🔔', active: true },
  ],
};

export default function NotificationsPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ unreadCount: 0, total: 0 });
  const [activeView, setActiveView] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/notification/my');
      setItems(data.items || []);
      setSummary({ unreadCount: data.unreadCount || 0, total: data.total || 0 });
    } catch (err) {
      console.error('Failed to load notifications:', err.response?.data || err.message);
      setItems([]);
      setSummary({ unreadCount: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`/api/notification/${id}/read`);
      load();
    } catch (err) {
      console.error('Failed to mark notification as read:', err.response?.data || err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notification/read-all');
      load();
    } catch (err) {
      console.error('Failed to mark all as read:', err.response?.data || err.message);
    }
  };

  const generateReminders = async () => {
    try {
      await Promise.all([
        axios.post('/api/notification/deadline-reminders'),
        axios.post('/api/notification/interview-reminders'),
      ]);
      setActiveView('deadline');
      load();
    } catch (err) {
      console.error('Failed to generate reminders:', err.response?.data || err.message);
    }
  };

  const generateInterviewReminders = async () => {
    try {
      setActiveView('interview');
      load();
    } catch (err) {
      console.error('Failed to filter interview reminders:', err.message);
    }
  };

  const visibleItems = items.filter((item) => {
    if (activeView === 'deadline') {
      return ['DEADLINE_REMINDER', 'INTERVIEW_REMINDER'].includes(item.type);
    }

    if (activeView === 'interview') {
      return ['INTERVIEW_INVITE', 'INTERVIEW_STATUS'].includes(item.type);
    }

    return true;
  });

  const links = navByRole[user?.role] || [];

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Notification Center</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className={`nav-link${link.active ? ' active' : ''}`}>
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              Unread: {summary.unreadCount} | Total: {summary.total}
              {activeView === 'deadline' ? ' | Showing: Deadline Reminders' : ''}
              {activeView === 'interview' ? ' | Showing: Interview Updates' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {user?.role === 'student' && (
              <>
                <button className="btn-secondary" onClick={generateReminders}>Check Deadline Reminders</button>
                <button className="btn-secondary" onClick={generateInterviewReminders}>Check Interview Reminders</button>
                <button className="btn-secondary" onClick={() => setActiveView('all')}>Show All</button>
              </>
            )}
            <button className="btn-secondary" onClick={markAllRead}>Mark All Read</button>
            <button className="btn-primary" onClick={load}>Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : visibleItems.length === 0 ? (
          <div className="glass-card" style={{ color: 'var(--text-muted)' }}>No notifications yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleItems.map((item) => (
              <div key={item._id} className="glass-card" style={{ borderColor: item.isRead ? 'rgba(99,102,241,0.12)' : 'rgba(14,165,233,0.45)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{item.message}</p>
                    <span className="metric-note">{new Date(item.createdAt).toLocaleString()} | {item.type}</span>
                  </div>
                  {!item.isRead && (
                    <button className="btn-primary" onClick={() => markRead(item._id)}>Mark Read</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
