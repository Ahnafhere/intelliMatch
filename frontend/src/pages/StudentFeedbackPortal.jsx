import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/StudentFeedbackPortal.css';

const initialForm = {
  applicationId: '',
  overallRating: 4,
  comment: '',
};

const formatDate = (value) => {
  if (!value) return 'Recently';
  return new Date(value).toLocaleDateString();
};

const ratingLabel = (value) => {
  if (value >= 4.5) return 'Excellent';
  if (value >= 3.5) return 'Strong';
  if (value >= 2.5) return 'Mixed';
  return 'Needs improvement';
};

export default function StudentFeedbackPortal() {
  const { user, logout } = useAuth();
  const token = user?.token;
  const [eligibleApplications, setEligibleApplications] = useState([]);
  const [communityFeedback, setCommunityFeedback] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadPortal = async () => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eligibleRes, communityRes] = await Promise.all([
        axios.get('/api/feedback/student/eligible', { headers }),
        axios.get('/api/feedback/student/community', { headers }),
      ]);

      setEligibleApplications(eligibleRes.data || []);
      setCommunityFeedback(communityRes.data || []);
      if (!form.applicationId && eligibleRes.data?.[0]?._id) {
        setForm((current) => ({ ...current, applicationId: eligibleRes.data[0]._id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the feedback portal.');
      setEligibleApplications([]);
      setCommunityFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, [token]);

  const filteredFeedback = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return communityFeedback;
    return communityFeedback.filter((item) => {
      const internshipTitle = item.internshipId?.title || '';
      const companyName = item.internshipId?.companyName || '';
      const studentName = item.fromUserId?.name || '';
      const comment = item.comment || '';
      return [internshipTitle, companyName, studentName, comment].some((value) => value.toLowerCase().includes(query));
    });
  }, [communityFeedback, search]);

  const stats = useMemo(() => {
    const total = communityFeedback.length;
    const average = total === 0 ? 0 : (communityFeedback.reduce((sum, item) => sum + Number(item.overallRating || 0), 0) / total).toFixed(1);
    const companies = new Set(communityFeedback.map((item) => item.internshipId?.companyName).filter(Boolean)).size;
    const eligibleCount = eligibleApplications.length;
    return { total, average, companies, eligibleCount };
  }, [communityFeedback, eligibleApplications]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/feedback', {
        ...form,
        overallRating: Number(form.overallRating),
      }, { headers });

      setForm(initialForm);
      await loadPortal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-layout feedback-portal">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Student Feedback Portal</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/student-dashboard" className="nav-link"><span>👤</span> My Profile</a>
          <a href="/internships" className="nav-link"><span>🔍</span> Browse Internships</a>
          <a href="/my-applications" className="nav-link"><span>📨</span> My Applications</a>
          <a href="/student-insights" className="nav-link"><span>📈</span> Skill Trends</a>
          <a href="/student-feedback" className="nav-link active"><span>💬</span> Feedback Portal</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <div className="feedback-shell">
          <section className="feedback-hero">
            <div className="feedback-hero-copy">
              <span className="feedback-kicker">Student feedback exchange</span>
              <h1>Share what your internship was really like.</h1>
              <p>
                Students can leave structured feedback after a selected or completed internship, and every student can browse the full community feed to learn from each other’s experiences.
              </p>
              <div className="feedback-hero-meta">
                <span className="feedback-meta-chip">{user?.name || 'Student'} logged in</span>
                <span className="feedback-meta-chip">{stats.eligibleCount} internship{stats.eligibleCount === 1 ? '' : 's'} ready for review</span>
                <span className="feedback-meta-chip">Open to all students</span>
              </div>
            </div>

            <div className="feedback-hero-panel">
              <div className="feedback-stat">
                <span className="feedback-stat-label">Community reviews</span>
                <span className="feedback-stat-value">{stats.total}</span>
              </div>
              <div className="feedback-stat">
                <span className="feedback-stat-label">Average rating</span>
                <span className="feedback-stat-value">{stats.average}</span>
              </div>
              <div className="feedback-stat">
                <span className="feedback-stat-label">Companies covered</span>
                <span className="feedback-stat-value">{stats.companies}</span>
              </div>
              <div className="feedback-stat">
                <span className="feedback-stat-label">Available to submit</span>
                <span className="feedback-stat-value">{stats.eligibleCount}</span>
              </div>
            </div>
          </section>

          {error && <div className="feedback-error">{error}</div>}

          <section className="feedback-grid">
            <div className="glass-card portal-panel">
              <h2>Write feedback</h2>
              <p className="panel-copy">Pick the company you worked with, give an overall rating, and write about the work environment, support, learning, and anything future students should know.</p>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}><div className="spinner"></div></div>
              ) : eligibleApplications.length === 0 ? (
                <div className="hint-box">
                  No completed or selected internships are available for feedback yet. Once your internship is marked selected or completed, it will appear here.
                </div>
              ) : (
                <form className="feedback-form" onSubmit={handleSubmit}>
                  <div>
                    <label>Completed internship</label>
                    <select
                      className="portal-select"
                      value={form.applicationId}
                      onChange={(event) => setForm({ ...form, applicationId: event.target.value })}
                      required
                    >
                      <option value="">Select an internship</option>
                      {eligibleApplications.map((application) => (
                        <option key={application._id} value={application._id}>
                          {application.internshipId?.title || 'Internship'} | {application.internshipId?.companyName || 'Company'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rating-field">
                    <label>Overall company rating</label>
                    <input
                      className="portal-input"
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      value={form.overallRating}
                      onChange={(event) => setForm({ ...form, overallRating: event.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label>Written feedback</label>
                    <textarea
                      className="portal-textarea"
                      rows="5"
                      placeholder="Describe the company culture, how supportive the team was, what you learned, what the internship was like day to day, and any advice for future students."
                      value={form.comment}
                      onChange={(event) => setForm({ ...form, comment: event.target.value })}
                      required
                    />
                  </div>

                  <div className="portal-actions">
                    <button className="btn-primary" type="submit" disabled={submitting}>
                      {submitting ? 'Publishing...' : 'Publish Feedback'}
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => setForm(initialForm)}
                      disabled={submitting}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="hint-box">
                    Focus on the company experience, internship environment, mentorship, workload, learning opportunities, and anything that would help another student decide.
                  </div>
                </form>
              )}
            </div>

            <div className="glass-card portal-panel">
              <div className="feed-toolbar">
                <div>
                  <h2>Community feedback</h2>
                  <p className="panel-copy" style={{ marginBottom: 0 }}>Browse internship experiences shared by other students.</p>
                </div>
                <input
                  className="portal-input"
                  type="search"
                  placeholder="Search company, internship, student, or comment"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}><div className="spinner"></div></div>
              ) : filteredFeedback.length === 0 ? (
                <div className="feedback-empty">
                  No shared feedback matches your search yet.
                </div>
              ) : (
                <div className="community-feed">
                  {filteredFeedback.map((item) => (
                    <article className="feedback-card" key={item._id}>
                      <div className="feedback-card-top">
                        <div>
                          <h3>{item.internshipId?.title || 'Internship feedback'}</h3>
                          <div className="feedback-company">{item.internshipId?.companyName || 'Company'}</div>
                        </div>
                        <div className="feedback-rating-row">
                          <span className="feedback-pill">⭐ {item.overallRating}/5</span>
                          <span className="feedback-pill">{ratingLabel(Number(item.overallRating || 0))}</span>
                        </div>
                      </div>

                      <div className="feedback-metadata">
                        <span>👤 {item.fromUserId?.name || 'Student reviewer'}</span>
                        <span>📅 {formatDate(item.createdAt)}</span>
                        {item.applicationId?.status && <span>📌 {item.applicationId.status}</span>}
                        {item.applicationId?.interviewStatus && <span>🗂️ {item.applicationId.interviewStatus}</span>}
                      </div>

                      <div className="feedback-rating-row">
                        <span className="feedback-pill">⭐ Overall {item.overallRating}/5</span>
                        <span className="feedback-pill">Work culture</span>
                        <span className="feedback-pill">Mentorship</span>
                        <span className="feedback-pill">Growth opportunity</span>
                      </div>

                      {item.comment ? (
                        <p className="feedback-comment">{item.comment}</p>
                      ) : (
                        <p className="feedback-comment" style={{ color: 'var(--text-muted)' }}>No written comment provided.</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}