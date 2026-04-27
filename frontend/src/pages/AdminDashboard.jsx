import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBadgeMeta, getEndorsementBadgeLevel } from '../utils/skillBadge';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [fraudulentAccounts, setFraudulentAccounts] = useState([]);
  const [studentsForVerification, setStudentsForVerification] = useState([]);
  const [verifyForm, setVerifyForm] = useState({ studentId: '', internshipId: '', source: 'manual', note: '' });
  const [weights, setWeights] = useState({ skillWeight: 0.75, cgpaWeight: 0.25 });
  const [activity, setActivity] = useState([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState('ALL');
  const [activityQuery, setActivityQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const actionGroup = (action = '') => {
    if (action.includes('INTERVIEW')) return 'INTERVIEW';
    if (action.includes('COMPANY') || action.includes('ACCOUNT') || action.includes('FRAUD') || action.includes('MODERAT')) return 'MODERATION';
    if (action.includes('ALGORITHM') || action.includes('WEIGHT')) return 'ALGORITHM';
    if (action.includes('LOGIN') || action.includes('REGISTER')) return 'AUTH';
    return 'SYSTEM';
  };

  const selectedStudent = useMemo(
    () => studentsForVerification.find((student) => student.studentId === verifyForm.studentId),
    [studentsForVerification, verifyForm.studentId]
  );

  const selectedInternship = useMemo(
    () => (selectedStudent?.appliedInternships || []).find((internship) => internship.internshipId === verifyForm.internshipId),
    [selectedStudent, verifyForm.internshipId]
  );

  const badgePreview = getEndorsementBadgeLevel({
    cgpa: selectedStudent?.cgpa || 0,
  });
  const badgePreviewMeta = getBadgeMeta(badgePreview);

  const load = async () => {
    setLoading(true);
    try {
      const [a, p, fraud, students, w, logs] = await Promise.all([
        axios.get('/api/analytics/admin/dashboard'),
        axios.get('/api/admin/companies/pending'),
        axios.get('/api/admin/users/fraudulent'),
        axios.get('/api/admin/students/verification-candidates'),
        axios.get('/api/admin/algorithm-weights'),
        axios.get('/api/admin/activity?limit=40'),
      ]);
      setAnalytics(a.data);
      setPendingCompanies(p.data || []);
      setFraudulentAccounts(fraud.data || []);
      setStudentsForVerification(students.data || []);
      setWeights(w.data.recommendationWeights || { skillWeight: 0.75, cgpaWeight: 0.25 });
      setActivity(logs.data || []);
    } catch {
      setAnalytics(null);
      setPendingCompanies([]);
      setFraudulentAccounts([]);
      setStudentsForVerification([]);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reviewCompany = async (id, decision) => {
    await axios.put(`/api/admin/companies/${id}/review`, { decision });
    load();
  };

  const updateWeights = async (e) => {
    e.preventDefault();
    await axios.put('/api/admin/algorithm-weights', weights);
    load();
  };

  const removeFraudulentAccount = async (user) => {
    const ok = window.confirm(`Remove fraudulent account for ${user.name} (${user.email})? This action permanently removes linked records.`);
    if (!ok) return;

    await axios.delete(`/api/admin/users/${user._id}/fraudulent`);
    load();
  };

  const verifySkill = async (e) => {
    e.preventDefault();
    await axios.post('/api/skill-verification', verifyForm);
    await load();
    setVerifyForm({ studentId: '', internshipId: '', source: 'manual', note: '' });
  };

  useEffect(() => {
    setVerifyForm((prev) => ({ ...prev, internshipId: '' }));
  }, [verifyForm.studentId]);

  const filteredActivity = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    return activity.filter((entry) => {
      const group = actionGroup(entry.action);
      if (activityTypeFilter !== 'ALL' && group !== activityTypeFilter) return false;

      if (!q) return true;

      const haystack = [
        entry.action,
        group,
        entry.actorId?.name,
        entry.actorId?.email,
        entry.actorRole,
        entry.entityType,
        entry.entityId,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(q);
    });
  }, [activity, activityQuery, activityTypeFilter]);

  const activityStats = useMemo(() => {
    const now = new Date();
    const today = filteredActivity.filter((entry) => {
      const created = new Date(entry.createdAt);
      return created.toDateString() === now.toDateString();
    }).length;

    const moderation = filteredActivity.filter((entry) => actionGroup(entry.action) === 'MODERATION').length;
    const uniqueActors = new Set(filteredActivity.map((entry) => entry.actorId?._id || entry.actorRole || 'system')).size;

    return {
      total: filteredActivity.length,
      today,
      moderation,
      uniqueActors,
    };
  }, [filteredActivity]);

  const badgeStyleByGroup = {
    MODERATION: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.45)' },
    ALGORITHM: { background: 'rgba(34,197,94,0.14)', color: '#86efac', border: '1px solid rgba(74,222,128,0.4)' },
    INTERVIEW: { background: 'rgba(14,165,233,0.14)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.42)' },
    AUTH: { background: 'rgba(245,158,11,0.14)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.4)' },
    SYSTEM: { background: 'rgba(99,102,241,0.14)', color: '#c4b5fd', border: '1px solid rgba(129,140,248,0.4)' },
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Admin Console</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/admin-dashboard" className="nav-link active"><span>🛡️</span> Dashboard</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
          <a href="/internships" className="nav-link"><span>📌</span> Internship Board</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <h1 className="page-title">Dashboard & Analytics System</h1>
        <p className="page-subtitle">Monitor placements, skills demand, moderation queue, and algorithm controls.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : (
          <>
            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div className="glass-card"><p className="metric-label">Total Internship Postings</p><h3 style={{ marginTop: '8px' }}>{analytics.totalInternshipPostings}</h3></div>
                <div className="glass-card"><p className="metric-label">Student Placement Ratio</p><h3 style={{ marginTop: '8px' }}>{analytics.studentPlacementRatio}%</h3></div>
                <div className="glass-card"><p className="metric-label">Total Applications</p><h3 style={{ marginTop: '8px' }}>{analytics.totalApplications}</h3></div>
                <div className="glass-card"><p className="metric-label">Selected Applications</p><h3 style={{ marginTop: '8px' }}>{analytics.selectedApplications}</h3></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Department-wise Placement Performance</h3>
                {(analytics?.departmentPlacement || []).slice(0, 8).map((d) => (
                  <div key={d.department} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>{d.department}</span><span>{d.selected}/{d.total} ({d.ratio}%)</span>
                  </div>
                ))}
              </div>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Top In-demand Skills</h3>
                {(analytics?.topInDemandSkills || []).slice(0, 10).map((s) => (
                  <div key={s.skill} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>{s.skill}</span><span>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Admin Monitoring & Moderation</h3>
                {pendingCompanies.length === 0 ? (
                  <p className="metric-note">No pending company registrations.</p>
                ) : (
                  pendingCompanies.map((c) => (
                    <div key={c._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <p style={{ fontWeight: 600 }}>{c.name}</p>
                      <p className="metric-note" style={{ marginBottom: '8px' }}>{c.email}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" onClick={() => reviewCompany(c._id, 'approved')}>Approve</button>
                        <button className="btn-danger" onClick={() => reviewCompany(c._id, 'rejected')}>Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className="glass-card" onSubmit={updateWeights}>
                <h3 style={{ marginBottom: '10px' }}>Adjust Algorithm Weights</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Skill Weight</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={weights.skillWeight}
                    onChange={(e) => setWeights({ ...weights, skillWeight: e.target.value })} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">CGPA Weight</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={weights.cgpaWeight}
                    onChange={(e) => setWeights({ ...weights, cgpaWeight: e.target.value })} />
                </div>
                <button className="btn-primary" type="submit">Save Weights</button>
              </form>
            </div>

            <form className="glass-card" onSubmit={verifySkill} style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '10px' }}>University Skill Verification</h3>
              <p className="metric-note" style={{ marginBottom: '10px' }}>
                Select a student and an applied internship role. Verification uses CGPA and required skill matching automatically.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label className="form-label">Student</label>
                  <select className="form-input" required value={verifyForm.studentId} onChange={(e) => setVerifyForm({ ...verifyForm, studentId: e.target.value })}>
                    <option value="">Select student</option>
                    {studentsForVerification.map((student) => (
                      <option key={student.studentId} value={student.studentId}>{student.name} ({student.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Applied Internship Role</label>
                  <select className="form-input" required value={verifyForm.internshipId} onChange={(e) => setVerifyForm({ ...verifyForm, internshipId: e.target.value })}>
                    <option value="">Select applied internship</option>
                    {(selectedStudent?.appliedInternships || []).map((internship) => (
                      <option key={internship.internshipId} value={internship.internshipId}>
                        {internship.internshipTitle} ({internship.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudent && (
                <div style={{ marginBottom: '10px', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <p className="metric-note" style={{ marginBottom: '8px' }}>
                    Student CGPA: <strong>{Number(selectedStudent.cgpa || 0).toFixed(2)}</strong>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(selectedStudent.topSkills || []).length === 0 ? (
                      <p className="metric-note">No skills found on this student profile.</p>
                    ) : (
                      (selectedStudent.topSkills || []).map((skill) => (
                        <span key={skill} className="skill-tag">{skill}</span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {selectedInternship && (
                <div style={{ marginBottom: '10px', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <p style={{ fontWeight: 700, marginBottom: '6px' }}>{selectedInternship.internshipTitle}</p>
                  <p className="metric-note" style={{ marginBottom: '8px' }}>
                    Required skills match: {selectedInternship.skillMatchPercent?.toFixed(2) || '0.00'}%
                  </p>
                  <p className="metric-note" style={{ marginBottom: '6px' }}>Matched skills:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {(selectedInternship.matchedSkills || []).length === 0 ? (
                      <span className="metric-note">No matched required skills.</span>
                    ) : (
                      (selectedInternship.matchedSkills || []).map((skill) => (
                        <span key={skill} className="skill-tag" style={{ background: 'rgba(34,197,94,0.14)', borderColor: 'rgba(34,197,94,0.45)', color: '#86efac' }}>{skill}</span>
                      ))
                    )}
                  </div>
                  <p className="metric-note" style={{ marginBottom: '6px' }}>Missing required skills (admin only):</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(selectedInternship.missingSkills || []).length === 0 ? (
                      <span className="metric-note">No missing required skills.</span>
                    ) : (
                      (selectedInternship.missingSkills || []).map((skill) => (
                        <span key={skill} className="skill-tag" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}>{skill}</span>
                      ))
                    )}
                  </div>
                </div>
              )}

              <p className="metric-note" style={{ marginBottom: '10px' }}>
                Badge preview: <strong>{badgePreviewMeta.label}</strong>
              </p>
              <p className="metric-note" style={{ marginBottom: '10px' }}>
                {selectedInternship?.missingSkills?.length > 0
                  ? 'Some required skills are missing. Verification will proceed by CGPA only.'
                  : 'Required skills are satisfied. Verification will use CGPA and skill compliance.'}
              </p>
              <div style={{ marginBottom: '10px' }}>
                <label className="form-label">Verification Note</label>
                <textarea className="form-input" rows="2" value={verifyForm.note} onChange={(e) => setVerifyForm({ ...verifyForm, note: e.target.value })}></textarea>
              </div>
              <button className="btn-primary" type="submit" disabled={!verifyForm.studentId || !verifyForm.internshipId}>Verify Student For Role</button>
            </form>

            <div className="glass-card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '10px' }}>Fraudulent Accounts</h3>
              {fraudulentAccounts.length === 0 ? (
                <p className="metric-note">No fraudulent accounts flagged right now.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {fraudulentAccounts.map((user) => (
                    <div key={user._id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', background: 'rgba(239,68,68,0.05)' }}>
                      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{user.name}</p>
                      <p className="metric-note" style={{ marginBottom: '4px' }}>{user.email}</p>
                      <p className="metric-note" style={{ marginBottom: '8px' }}>Role: {user.role} | Active: {user.isActive ? 'Yes' : 'No'}</p>
                      {user.moderationNote && <p className="metric-note" style={{ marginBottom: '8px' }}>Reason: {user.moderationNote}</p>}
                      <button className="btn-danger" onClick={() => removeFraudulentAccount(user)} style={{ width: '100%' }}>Remove Fraudulent Account</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>System Activity Monitor</h3>
                  <p className="metric-note">Track moderation, interview, algorithm, and authentication events in one place.</p>
                </div>
                <button className="btn-secondary" onClick={load}>Refresh Logs</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px' }}>
                  <p className="metric-label">Visible Logs</p>
                  <h4 style={{ marginTop: '6px' }}>{activityStats.total}</h4>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px' }}>
                  <p className="metric-label">Today</p>
                  <h4 style={{ marginTop: '6px' }}>{activityStats.today}</h4>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px' }}>
                  <p className="metric-label">Moderation</p>
                  <h4 style={{ marginTop: '6px' }}>{activityStats.moderation}</h4>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px' }}>
                  <p className="metric-label">Unique Actors</p>
                  <h4 style={{ marginTop: '6px' }}>{activityStats.uniqueActors}</h4>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '10px', marginBottom: '12px' }}>
                <select className="form-input" value={activityTypeFilter} onChange={(e) => setActivityTypeFilter(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  <option value="MODERATION">Moderation</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="ALGORITHM">Algorithm</option>
                  <option value="AUTH">Authentication</option>
                  <option value="SYSTEM">System</option>
                </select>
                <input
                  className="form-input"
                  value={activityQuery}
                  onChange={(e) => setActivityQuery(e.target.value)}
                  placeholder="Search by action, actor name, role, or entity"
                />
              </div>

              {filteredActivity.length === 0 ? (
                <p className="metric-note">No matching activity logs found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredActivity.map((entry) => {
                    const group = actionGroup(entry.action);
                    return (
                      <div key={entry._id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ ...badgeStyleByGroup[group], borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{group}</span>
                            <span style={{ fontWeight: 700 }}>{entry.action}</span>
                          </div>
                          <span className="metric-note">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <span className="metric-note">Actor: {entry.actorId?.name || 'System'} ({entry.actorRole || 'N/A'})</span>
                          <span className="metric-note">Entity: {entry.entityType || 'N/A'} {entry.entityId || ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
