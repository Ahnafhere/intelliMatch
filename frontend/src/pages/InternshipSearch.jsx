import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function InternshipSearch() {
  const { user, logout } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ company: '', skill: '', department: '', deadline: '' });
  const [applying, setApplying] = useState({});
  const [applied, setApplied] = useState({});
  const [msg, setMsg] = useState({});

  const sidebarLinks = user?.role === 'student'
    ? [
        { href: '/student-dashboard', label: 'My Profile', icon: '👤' },
        { href: '/internships', label: 'Browse Internships', icon: '🔍', active: true },
        { href: '/my-applications', label: 'My Applications', icon: '📨' },
        { href: '/student-insights', label: 'Skill Trends', icon: '📈' },
        { href: '/interviews', label: 'Interviews', icon: '🗓️' },
        { href: '/notifications', label: 'Notifications', icon: '🔔' },
      ]
    : [
        { href: '/admin-dashboard', label: 'Admin Dashboard', icon: '🛡️' },
        { href: '/internships', label: 'Internship Board', icon: '📌', active: true },
        { href: '/interviews', label: 'Interviews', icon: '🗓️' },
        { href: '/notifications', label: 'Notifications', icon: '🔔' },
      ];

  const fetchInternships = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
    try {
      const { data } = await axios.get('/api/internship/search', { params });
      setInternships(data);
    } catch { setInternships([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInternships(); }, []);

  const applyToInternship = async (internshipId) => {
    setApplying(a => ({ ...a, [internshipId]: true }));
    try {
      await axios.post('/api/application', { internshipId });
      setApplied(a => ({ ...a, [internshipId]: true }));
      setMsg(m => ({ ...m, [internshipId]: '✅ Applied!' }));
    } catch (err) {
      setMsg(m => ({ ...m, [internshipId]: '❌ ' + (err.response?.data?.message || 'Failed') }));
    } finally {
      setApplying(a => ({ ...a, [internshipId]: false }));
    }
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Internship Board</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sidebarLinks.map((link) => (
            <a key={link.href} href={link.href} className={`nav-link${link.active ? ' active' : ''}`}>
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>
      <main className="content-area">
        <h1 className="page-title">Browse Internships</h1>
        <p className="page-subtitle">Search and apply to internships that match your skills</p>

        {/* Filter Panel */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label className="form-label">Company Name</label>
              <input className="form-input" placeholder="Search company..." value={filters.company}
                onChange={e => setFilters({ ...filters, company: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Required Skill</label>
              <input className="form-input" placeholder="e.g. React" value={filters.skill}
                onChange={e => setFilters({ ...filters, skill: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input className="form-input" placeholder="e.g. CSE" value={filters.department}
                onChange={e => setFilters({ ...filters, department: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Open Until</label>
              <input className="form-input" type="date" value={filters.deadline}
                onChange={e => setFilters({ ...filters, deadline: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button className="btn-primary" onClick={fetchInternships}>🔍 Search</button>
            <button className="btn-secondary" onClick={() => { setFilters({ company: '', skill: '', department: '', deadline: '' }); setTimeout(fetchInternships, 50); }}>Clear</button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : internships.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px' }}>📭</div>
            <p style={{ marginTop: '12px' }}>No internships found matching your filters</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {internships.map(p => (
              <div key={p._id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>{p.title}</h3>
                    <p style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      {p.companyName || 'Unknown Company'}
                    </p>
                    {p.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>{p.description}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      {p.department && <span>📁 {p.department}</span>}
                      {p.deadline && <span>📅 Deadline: {new Date(p.deadline).toLocaleDateString()}</span>}
                      {p.minCGPA > 0 && <span>🎓 Min CGPA: {p.minCGPA}</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.requiredSkills?.map(s => (
                        <span key={s.skill} className="skill-tag" style={{ fontSize: '12px' }}>
                          {s.skill}
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>w:{s.weight}</span>
                        </span>
                      ))}
                    </div>

                    {p.matchInsights && (
                      <div className="match-panel" style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                          <span className="metric-label">AI Match Score</span>
                          <strong>{p.matchInsights.matchScore}%</strong>
                        </div>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${p.matchInsights.matchScore}%` }}></div>
                        </div>
                        <p className="metric-note" style={{ marginTop: '8px' }}>
                          Smart recommendation score: {p.matchInsights.recommendationScore}%
                        </p>
                        {p.matchInsights.skillGapReport?.missingSkills?.length > 0 ? (
                          <div style={{ marginTop: '8px' }}>
                            <p className="metric-label" style={{ marginBottom: '6px' }}>Skill gap report</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {p.matchInsights.skillGapReport.missingSkills.slice(0, 4).map((miss) => (
                                <span key={miss.skill} className="skill-tag" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}>
                                  Missing: {miss.skill}
                                </span>
                              ))}
                            </div>
                            {p.matchInsights.skillGapReport.missingSkills[0]?.recommendedLearningPaths?.length > 0 && (
                              <p className="metric-note" style={{ marginTop: '6px' }}>
                                Learn next: {p.matchInsights.skillGapReport.missingSkills[0].recommendedLearningPaths.join(' | ')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="metric-note" style={{ marginTop: '8px', color: '#4ade80' }}>
                            Great fit. You meet all required skills.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {user?.role === 'student' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                      <button className="btn-primary" onClick={() => applyToInternship(p._id)}
                        disabled={applied[p._id] || applying[p._id]} style={{ whiteSpace: 'nowrap' }}>
                        {applying[p._id] ? 'Applying...' : applied[p._id] ? '✓ Applied' : 'Apply Now'}
                      </button>
                      {msg[p._id] && <span style={{ fontSize: '12px', color: msg[p._id].startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg[p._id]}</span>}
                    </div>
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
