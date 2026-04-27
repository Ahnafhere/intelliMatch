import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function InterviewCenter() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    applicationId: '',
    scheduledAt: '',
    durationMinutes: 45,
    mode: 'Online',
    meetingLink: '',
    location: '',
    notes: '',
  });

  const canSchedule = user?.role === 'company';

  const sidebar = useMemo(() => {
    if (user?.role === 'student') {
      return [
        { href: '/student-dashboard', label: 'Dashboard', icon: '👤' },
        { href: '/my-applications', label: 'My Applications', icon: '📨' },
        { href: '/student-feedback', label: 'Feedback Portal', icon: '💬' },
        { href: '/interviews', label: 'Interviews', icon: '🗓️', active: true },
        { href: '/notifications', label: 'Notifications', icon: '🔔' },
      ];
    }

    if (user?.role === 'company') {
      return [
        { href: '/company-dashboard', label: 'Dashboard', icon: '🏢' },
        { href: '/interviews', label: 'Interviews', icon: '🗓️', active: true },
        { href: '/interview-reports', label: 'Reports & Analytics', icon: '📊' },
        { href: '/notifications', label: 'Notifications', icon: '🔔' },
      ];
    }

    return [
      { href: '/admin-dashboard', label: 'Admin Dashboard', icon: '🛡️' },
      { href: '/interviews', label: 'Interviews', icon: '🗓️', active: true },
      { href: '/interview-reports', label: 'Reports & Analytics', icon: '📊' },
      { href: '/notifications', label: 'Notifications', icon: '🔔' },
    ];
  }, [user?.role]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: interviews }, appsRes] = await Promise.all([
        axios.get('/api/interview/my'),
        canSchedule ? axios.get('/api/internship/company') : Promise.resolve({ data: [] }),
      ]);

      setItems(interviews || []);

      if (canSchedule) {
        const internships = appsRes.data || [];
        const appCollections = await Promise.all(
          internships.map((post) =>
            axios.get(`/api/application/internship/${post._id}`).then((r) => r.data || []).catch(() => [])
          )
        );

        const flattened = appCollections.flat().filter((a) => a.status !== 'Rejected');
        setApps(flattened);
      }
    } catch {
      setItems([]);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const schedule = async (e) => {
    e.preventDefault();
    await axios.post('/api/interview', form);
    setForm({ applicationId: '', scheduledAt: '', durationMinutes: 45, mode: 'Online', meetingLink: '', location: '', notes: '' });
    load();
  };

  const confirm = async (id, confirmation) => {
    await axios.put(`/api/interview/${id}/confirm`, { confirmation });
    load();
  };

  const updateStatus = async (id, status) => {
    await axios.put(`/api/interview/${id}/status`, { status });
    load();
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Interview Center</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sidebar.map((link) => (
            <a key={link.href} href={link.href} className={`nav-link${link.active ? ' active' : ''}`}>
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <h1 className="page-title">Interview Scheduling & Tracking</h1>
        <p className="page-subtitle">Schedule interviews, track outcomes, and maintain interview history in real-time.</p>

        {canSchedule && (
          <form className="glass-card" onSubmit={schedule} style={{ marginBottom: '16px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Application</label>
              <select className="form-input" required value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })}>
                <option value="">Select application</option>
                {apps.map((app) => (
                  <option key={app._id} value={app._id}>{app.studentId?.name || 'Student'} | {app.studentId?.email || 'N/A'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Date & Time</label>
              <input className="form-input" type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" min="15" max="180" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Mode</label>
              <select className="form-input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="Online">Online</option>
                <option value="Onsite">Onsite</option>
                <option value="Phone">Phone</option>
              </select>
            </div>
            <div>
              <label className="form-label">Meeting Link</label>
              <input className="form-input" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}></textarea>
            </div>
            <div>
              <button className="btn-primary" type="submit">Schedule Interview</button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : items.length === 0 ? (
          <div className="glass-card" style={{ color: 'var(--text-muted)' }}>No interviews found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => (
              <div key={item._id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginBottom: '4px' }}>{item.internshipId?.title || 'Interview'}</h3>
                    <p className="metric-note" style={{ marginBottom: '6px' }}>
                      {new Date(item.scheduledAt).toLocaleString()} | {item.mode} | {item.durationMinutes} min
                    </p>
                    <p className="metric-note" style={{ marginBottom: '6px' }}>
                      Student confirmation: {item.studentConfirmation} | Status: {item.status}
                    </p>
                    {item.meetingLink && <a href={item.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', fontSize: '13px' }}>Meeting Link</a>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                    {user?.role === 'student' && item.studentConfirmation === 'Pending' && (
                      <>
                        <button className="btn-primary" onClick={() => confirm(item._id, 'Confirmed')}>Confirm Availability</button>
                        <button className="btn-danger" onClick={() => confirm(item._id, 'Declined')}>Decline</button>
                      </>
                    )}
                    {canSchedule && (
                      <select className="form-input" value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)}>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    )}
                  </div>
                </div>
                {item.history?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <p className="metric-label" style={{ marginBottom: '6px' }}>History</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.history.slice().reverse().map((h, idx) => (
                        <span key={idx} className="metric-note">{new Date(h.changedAt).toLocaleString()} - {h.status}{h.note ? ` (${h.note})` : ''}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
