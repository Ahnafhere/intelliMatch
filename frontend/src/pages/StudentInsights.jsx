import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const badgeMeta = {
  gold: { label: 'Gold', style: { background: 'rgba(234,179,8,0.18)', borderColor: 'rgba(234,179,8,0.45)', color: '#fde68a' } },
  silver: { label: 'Silver', style: { background: 'rgba(148,163,184,0.2)', borderColor: 'rgba(148,163,184,0.45)', color: '#e2e8f0' } },
  bronze: { label: 'Bronze', style: { background: 'rgba(180,83,9,0.2)', borderColor: 'rgba(180,83,9,0.45)', color: '#fdba74' } },
};

const formatSkillName = (skill = '') => skill
  .split(' ')
  .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
  .join(' ');

const maxCount = (rows = []) => Math.max(1, ...rows.map((row) => Number(row.count || 0)));

export default function StudentInsights() {
  const { logout } = useAuth();
  const [trends, setTrends] = useState(null);
  const [marketTrends, setMarketTrends] = useState(null);
  const [verifiedSkills, setVerifiedSkills] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [t, m, v, f] = await Promise.all([
        axios.get('/api/analytics/student/match-trends'),
        axios.get('/api/analytics/market-skill-trends'),
        axios.get('/api/skill-verification/my'),
        axios.get('/api/feedback/my'),
      ]);
      setTrends(t.data);
      setMarketTrends(m.data);
      setVerifiedSkills(v.data || []);
      setFeedback(f.data || []);
    } catch {
      setTrends(null);
      setMarketTrends(null);
      setVerifiedSkills([]);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Student Insights</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/student-dashboard" className="nav-link"><span>👤</span> Dashboard</a>
          <a href="/my-applications" className="nav-link"><span>📨</span> My Applications</a>
          <a href="/student-insights" className="nav-link active"><span>📈</span> Skill Trends</a>
          <a href="/student-feedback" className="nav-link"><span>💬</span> Feedback Portal</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <h1 className="page-title">Student Skill Trend Portal</h1>
        <p className="page-subtitle">See which skills are in demand, where the market is moving, and how your profile compares.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card"><p className="metric-label">Top Requested Skills</p><h3 style={{ marginTop: '8px' }}>{marketTrends?.mostRequestedTechnicalSkills?.length || 0}</h3></div>
              <div className="glass-card"><p className="metric-label">Tracked Departments</p><h3 style={{ marginTop: '8px' }}>{marketTrends?.departmentWiseSkillDemandGap?.length || 0}</h3></div>
              <div className="glass-card"><p className="metric-label">Verified Skills</p><h3 style={{ marginTop: '8px' }}>{verifiedSkills.length}</h3></div>
              <div className="glass-card"><p className="metric-label">Average Match Score</p><h3 style={{ marginTop: '8px' }}>{trends?.avgMatchScore || 0}%</h3></div>
            </div>

            <div className="glass-card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>What the market wants right now</h3>
                  <p className="metric-note">Use these trends to decide what to learn next and which internship areas are growing fastest.</p>
                </div>
                <span className="skill-tag" style={{ background: 'rgba(14,165,233,0.14)', borderColor: 'rgba(14,165,233,0.35)', color: '#7dd3fc' }}>
                  Live internship demand
                </span>
              </div>

              {(marketTrends?.mostRequestedTechnicalSkills || []).length === 0 ? (
                <p className="metric-note">No market trend data is available yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div className="glass-card" style={{ padding: '18px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Most requested technical skills</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {marketTrends.mostRequestedTechnicalSkills.slice(0, 8).map((skill, index) => {
                        const topCount = maxCount(marketTrends.mostRequestedTechnicalSkills);
                        const width = `${Math.max(8, (Number(skill.count || 0) / topCount) * 100)}%`;
                        return (
                          <div key={`${skill.skill}_${index}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600 }}>{formatSkillName(skill.skill)}</span>
                              <span className="metric-note">Requested {skill.count} times</span>
                            </div>
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '18px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Emerging skill trends</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(marketTrends.emergingSkillTrends || []).slice(0, 12).map((skill) => (
                        <span key={skill.skill} className="skill-tag" style={{ background: 'rgba(99,102,241,0.16)' }}>
                          {formatSkillName(skill.skill)} · {skill.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '10px' }}>Department-wise skill demand gap</h3>
              {(marketTrends?.departmentWiseSkillDemandGap || []).length === 0 ? (
                <p className="metric-note">No department-wise gap data is available yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {(marketTrends.departmentWiseSkillDemandGap || []).map((dept) => (
                    <div key={dept.department} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', background: 'rgba(15,23,42,0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontWeight: 700 }}>{dept.department}</p>
                          <p className="metric-note">Departments where these skills are missing</p>
                        </div>
                        <span className="rank-pill">{dept.topMissingSkills.length} skill{dept.topMissingSkills.length === 1 ? '' : 's'}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {dept.topMissingSkills.length === 0 ? (
                          <p className="metric-note">No major gap detected for this department.</p>
                        ) : (
                          dept.topMissingSkills.map((skill) => (
                            <span key={skill.skill} className="skill-tag" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                              {formatSkillName(skill.skill)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '10px' }}>Your application match trend</h3>
              {(trends?.trend || []).length === 0 ? (
                <p className="metric-note">No applications yet.</p>
              ) : (
                (trends?.trend || []).map((row) => (
                  <div key={row.applicationId} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 600 }}>{row.title}</p>
                    <p className="metric-note">{new Date(row.appliedAt).toLocaleDateString()} | Match {row.matchScore}% | Recommendation {row.recommendationScore}% | {row.status}</p>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Skill Verification Badges</h3>
                {verifiedSkills.length === 0 ? (
                  <p className="metric-note">No verified skills yet.</p>
                ) : (
                  verifiedSkills.map((skill, idx) => (
                    <div key={`${skill.skill}_${idx}`} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                        <span className="skill-tag" style={{ background: 'rgba(34,197,94,0.14)', borderColor: 'rgba(34,197,94,0.45)', color: '#86efac' }}>Verified: {skill.skill}</span>
                        <span className="skill-tag" style={badgeMeta[skill.badgeLevel || 'bronze']?.style || badgeMeta.bronze.style}>
                          {badgeMeta[skill.badgeLevel || 'bronze']?.label || 'Bronze'} Badge
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Internship Performance Feedback</h3>
                {feedback.length === 0 ? (
                  <p className="metric-note">No feedback received yet.</p>
                ) : (
                  feedback.map((item) => (
                    <div key={item._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <p style={{ fontWeight: 600 }}>{item.internshipId?.title || 'Internship'}</p>
                      <p className="metric-note">Rating: {item.overallRating}/5 | From: {item.fromUserId?.name || 'Reviewer'}</p>
                      {item.comment && <p className="metric-note">"{item.comment}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
