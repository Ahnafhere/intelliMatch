import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBadgeMeta, getEndorsementBadgeLevel } from '../utils/skillBadge';

export default function CompanyInsights() {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyForm, setVerifyForm] = useState({ studentId: '', internshipId: '', source: 'internship_performance', note: '' });
  const [feedbackForm, setFeedbackForm] = useState({
    applicationId: '',
    technicalSkills: 4,
    communication: 4,
    teamwork: 4,
    overallRating: 4,
    comment: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [analyticsRes, postsRes] = await Promise.all([
        axios.get('/api/analytics/company/applicants'),
        axios.get('/api/internship/company'),
      ]);

      const posts = postsRes.data || [];
      const appCollections = await Promise.all(
        posts.map((post) => axios.get(`/api/application/internship/${post._id}`).then((r) => r.data || []).catch(() => []))
      );

      setAnalytics(analyticsRes.data);
      setApplications(appCollections.flat());
    } catch {
      setAnalytics(null);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setVerifyForm((prev) => ({ ...prev, internshipId: '' }));
  }, [verifyForm.studentId]);

  const verifySkill = async (e) => {
    e.preventDefault();
    await axios.post('/api/skill-verification', verifyForm);
    setVerifyForm({ studentId: '', internshipId: '', source: 'internship_performance', note: '' });
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    await axios.post('/api/feedback', feedbackForm);
    setFeedbackForm({ applicationId: '', technicalSkills: 4, communication: 4, teamwork: 4, overallRating: 4, comment: '' });
  };

  const selectedApplications = applications.filter((app) => app.studentId?._id === verifyForm.studentId);
  const selectedApplication = selectedApplications.find((app) => app.internshipId?.toString() === verifyForm.internshipId);
  const badgePreview = getEndorsementBadgeLevel({
    cgpa: selectedApplication?.cgpaAtApply || selectedApplication?.studentProfile?.cgpa || 0,
  });
  const badgePreviewMeta = getBadgeMeta(badgePreview);

  const studentOptions = applications.reduce((acc, app) => {
    const id = app.studentId?._id;
    if (!id) return acc;
    if (!acc.some((entry) => entry.studentId === id)) {
      acc.push({ studentId: id, name: app.studentId?.name || 'Student', email: app.studentId?.email || 'N/A' });
    }
    return acc;
  }, []);

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Company Insights</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/company-dashboard" className="nav-link"><span>🏢</span> Dashboard</a>
          <a href="/company-insights" className="nav-link active"><span>📊</span> Analytics & Feedback</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <h1 className="page-title">Applicant Analytics & Performance Tools</h1>
        <p className="page-subtitle">View applicant metrics, verify student skills, and submit internship performance feedback.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card"><p className="metric-label">Total Postings</p><h3 style={{ marginTop: '8px' }}>{analytics?.totalPosts || 0}</h3></div>
              <div className="glass-card"><p className="metric-label">Total Applicants</p><h3 style={{ marginTop: '8px' }}>{analytics?.totalApplicants || 0}</h3></div>
            </div>

            <div className="glass-card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '10px' }}>Applicant Analytics by Posting</h3>
              {(analytics?.byPost || []).length === 0 ? (
                <p className="metric-note">No analytics data yet.</p>
              ) : (
                (analytics?.byPost || []).map((post) => (
                  <div key={post.internshipId} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 600 }}>{post.title}</p>
                    <p className="metric-note">Applicants: {post.applicants} | Shortlisted: {post.shortlisted} | Selected: {post.selected} | Avg Match: {post.avgMatch}%</p>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <form className="glass-card" onSubmit={verifySkill}>
                <h3 style={{ marginBottom: '10px' }}>Skill Verification & Endorsement</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Student</label>
                  <select className="form-input" required value={verifyForm.studentId} onChange={(e) => setVerifyForm({ ...verifyForm, studentId: e.target.value })}>
                    <option value="">Select student</option>
                    {studentOptions.map((student) => (
                      <option key={`vs_${student.studentId}`} value={student.studentId}>{student.name} ({student.email})</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Internship Role</label>
                  <select className="form-input" required value={verifyForm.internshipId} onChange={(e) => setVerifyForm({ ...verifyForm, internshipId: e.target.value })}>
                    <option value="">Select role</option>
                    {selectedApplications.map((a) => (
                      <option key={`role_${a._id}`} value={a.internshipId?.toString()}>
                        Application #{a._id.slice(-6)} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Source</label>
                  <select className="form-input" value={verifyForm.source} onChange={(e) => setVerifyForm({ ...verifyForm, source: e.target.value })}>
                    <option value="certification">certification</option>
                    <option value="project_review">project_review</option>
                    <option value="internship_performance">internship_performance</option>
                  </select>
                </div>
                <p className="metric-note" style={{ marginBottom: '10px' }}>
                  Badge preview: <strong>{badgePreviewMeta.label}</strong>
                </p>
                <p className="metric-note" style={{ marginBottom: '10px' }}>
                  Based on CGPA {Number(selectedApplication?.cgpaAtApply || selectedApplication?.studentProfile?.cgpa || 0).toFixed(2)}
                </p>
                <p className="metric-note" style={{ marginBottom: '10px' }}>
                  Missing required skills: {(selectedApplication?.skillGapReport?.missingSkills || []).map((entry) => entry.skill).join(', ') || 'None'}
                </p>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Note</label>
                  <textarea className="form-input" rows="2" value={verifyForm.note} onChange={(e) => setVerifyForm({ ...verifyForm, note: e.target.value })}></textarea>
                </div>
                <button className="btn-primary" type="submit" disabled={!verifyForm.studentId || !verifyForm.internshipId}>Verify Student</button>
              </form>

              <form className="glass-card" onSubmit={submitFeedback}>
                <h3 style={{ marginBottom: '10px' }}>Internship Performance Feedback</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Application</label>
                  <select className="form-input" required value={feedbackForm.applicationId} onChange={(e) => setFeedbackForm({ ...feedbackForm, applicationId: e.target.value })}>
                    <option value="">Select application</option>
                    {applications.map((a) => (
                      <option key={`fb_${a._id}`} value={a._id}>{a.studentId?.name || 'Student'} | Score {Number(a.recommendationScore || 0).toFixed(2)}%</option>
                    ))}
                  </select>
                </div>
                {['technicalSkills', 'communication', 'teamwork', 'overallRating'].map((field) => (
                  <div key={field} style={{ marginBottom: '10px' }}>
                    <label className="form-label">{field}</label>
                    <input className="form-input" type="number" min="1" max="5" value={feedbackForm[field]} onChange={(e) => setFeedbackForm({ ...feedbackForm, [field]: Number(e.target.value) })} />
                  </div>
                ))}
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Comment</label>
                  <textarea className="form-input" rows="2" value={feedbackForm.comment} onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}></textarea>
                </div>
                <button className="btn-primary" type="submit">Submit Feedback</button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
