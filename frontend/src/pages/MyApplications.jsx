import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getBadgeMeta } from '../utils/skillBadge';

const statusColors = {
  Pending: 'badge-pending',
  Shortlisted: 'badge-shortlisted',
  Selected: 'badge-selected',
  Rejected: 'badge-rejected',
};

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.post('/api/notification/deadline-reminders').catch(() => {});
    axios.get('/api/application/my')
      .then(r => setApps(r.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Student Portal</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/student-dashboard" className="nav-link"><span>👤</span> My Profile</a>
          <a href="/internships" className="nav-link"><span>🔍</span> Browse Internships</a>
          <a href="/my-applications" className="nav-link active"><span>📨</span> My Applications</a>
          <a href="/student-insights" className="nav-link"><span>📈</span> Skill Trends</a>
          <a href="/student-feedback" className="nav-link"><span>💬</span> Feedback Portal</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={() => { localStorage.removeItem('intellimatch_user'); window.location.href = '/login'; }} style={{ width: '100%' }}>Sign Out</button>
      </aside>
      <main className="content-area">
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">Track the status of all your internship applications</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : apps.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px' }}>📭</div>
            <p style={{ marginTop: '12px' }}>You haven't applied to any internships yet</p>
            <a href="/internships" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>Browse Internships</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {apps.map(app => {
              const intern = app.internshipId;
              const badgeMeta = getBadgeMeta(app.endorsementBadge);
              return (
                <div key={app._id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{intern?.title || 'Internship'}</h3>
                        <span className={`badge ${statusColors[app.status]}`}>{app.status}</span>
                        <span className="skill-tag" style={badgeMeta.style}>{badgeMeta.label} Badge</span>
                      </div>
                      <p style={{ color: 'var(--primary)', fontWeight: '500', fontSize: '14px', marginBottom: '8px' }}>
                        {intern?.companyName || 'Company'}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        {intern?.department && <span>📁 {intern.department}</span>}
                        {intern?.deadline && <span>📅 Deadline: {new Date(intern.deadline).toLocaleDateString()}</span>}
                        <span>🕐 Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="match-panel" style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                          <span className="metric-label">Match Score</span>
                          <strong>{Number(app.matchScore || 0).toFixed(2)}%</strong>
                        </div>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${Math.min(100, Number(app.matchScore || 0))}%` }}></div>
                        </div>
                        <p className="metric-note" style={{ marginTop: '8px' }}>
                          Recommendation Score: {Number(app.recommendationScore || 0).toFixed(2)}%
                        </p>
                        <p className="metric-note" style={{ marginTop: '4px' }}>
                          Endorsement Badge: {badgeMeta.label}
                        </p>
                        {(app.skillGapReport?.missingSkills || []).length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <p className="metric-label" style={{ marginBottom: '6px' }}>Missing competencies</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {app.skillGapReport.missingSkills.slice(0, 3).map((skill) => (
                                <span key={skill.skill} className="skill-tag" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                                  {skill.skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {intern?.requiredSkills && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {intern.requiredSkills.map(s => (
                            <span key={s.skill} className="skill-tag" style={{ fontSize: '12px' }}>{s.skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                      <span className={`badge ${statusColors[app.status]}`} style={{ fontSize: '14px', padding: '6px 14px' }}>{app.status}</span>
                    </div>
                  </div>

                  {/* Status progress bar */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', height: '6px', background: 'var(--border)' }}>
                      {['Applied', 'Shortlisted', 'Interview Scheduled', 'Final Decision'].map((step, i) => {
                        const timelineStages = (app.timeline || []).map((x) => x.stage);
                        const isActive = timelineStages.includes(step);
                        return <div key={step} style={{ flex: 1, background: isActive ? 'linear-gradient(90deg, #6366f1, #0ea5e9)' : 'transparent', margin: '0 1px', borderRadius: '4px' }}></div>;
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      {['Applied', 'Shortlisted', 'Interview Scheduled', 'Final Decision'].map(step => (
                        <span key={step} style={{ fontSize: '11px', color: (app.timeline || []).some((x) => x.stage === step) ? 'var(--primary)' : 'var(--text-muted)' }}>{step}</span>
                      ))}
                    </div>
                  </div>

                  {(app.timeline || []).length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p className="metric-label" style={{ marginBottom: '6px' }}>Progress Timeline</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {app.timeline.slice().reverse().map((event, idx) => (
                          <span key={`${event.stage}_${idx}`} className="metric-note">
                            {new Date(event.changedAt).toLocaleString()} - {event.stage}{event.note ? ` (${event.note})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
