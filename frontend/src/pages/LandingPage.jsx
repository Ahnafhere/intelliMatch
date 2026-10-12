import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthModal from '../components/AuthModal';
import '../styles/Landing.css';

const FEATURES = [
  { icon: '🧠', title: 'AI skill matching', text: 'Every internship gets a personal match score based on your skills, verified badges and CGPA.' },
  { icon: '📄', title: 'Instant CV parsing', text: 'Upload your CV once — we extract your skills automatically so you never fill long forms.' },
  { icon: '🐙', title: 'GitHub skill import', text: 'Pull real skills straight from your GitHub repositories and stand out to recruiters.' },
  { icon: '✅', title: 'Verified skill badges', text: 'Prove what you know with verified skills that companies trust when shortlisting.' },
  { icon: '📅', title: 'Interview tracking', text: 'Schedules, status updates and a full timeline for every application in one place.' },
  { icon: '📊', title: 'Insights & analytics', text: 'See which skills are in demand and how to raise your match score.' },
];

const STEPS = [
  { n: '1', title: 'Create your profile', text: 'Sign in with Google in seconds and upload your CV or import skills from GitHub.' },
  { n: '2', title: 'Get matched', text: 'Our engine ranks internships by how well they fit you — no more guessing.' },
  { n: '3', title: 'Apply & track', text: 'Apply in one click and follow every interview and decision in real time.' },
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;
const isClosed = (d) => d && new Date(d) < new Date();

export default function LandingPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('All');
  const [modal, setModal] = useState({ open: false });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/internship/public')
      .then(({ data }) => setData(data))
      .catch(() => setLoadError(true));
  }, []);

  const openAuth = useCallback((opts = {}) => {
    setMenuOpen(false);
    setModal({ open: true, ...opts });
  }, []);
  const closeAuth = useCallback(() => setModal({ open: false }), []);

  const departments = useMemo(() => {
    const set = new Set((data?.internships || []).map(i => i.department?.trim()).filter(Boolean).map(d => d.toUpperCase()));
    return ['All', ...[...set].slice(0, 8)];
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.internships || []).filter(i => {
      if (dept !== 'All' && i.department?.trim().toUpperCase() !== dept) return false;
      if (!q) return true;
      return [i.title, i.companyName, i.department, i.description, ...(i.requiredSkills || []).map(s => s.skill)]
        .some(v => v?.toLowerCase().includes(q));
    });
  }, [data, query, dept]);

  const stats = data?.stats;

  return (
    <div className="lp">
      {/* Navigation */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-logo gradient-text">IntelliMatch</Link>
          <nav className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#internships" onClick={() => setMenuOpen(false)}>Internships</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#companies" onClick={() => setMenuOpen(false)}>For companies</a>
            <Link to="/login" className="lp-nav-login">Log in</Link>
            <button className="btn-primary" onClick={() => openAuth()}>Get started</button>
          </nav>
          <button className="lp-burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div>
            <span className="lp-badge">✨ AI-powered internship matching</span>
            <h1 className="lp-hero-title">
              Find internships that <span className="gradient-text">actually match</span> your skills
            </h1>
            <p className="lp-hero-sub">
              IntelliMatch reads your CV, understands your skills and ranks every opening by how well it fits you.
              Apply in one click and track every interview — all in one place.
            </p>
            <div className="lp-hero-ctas">
              <a href="#internships" className="btn-primary lp-btn-lg">Browse internships</a>
              <button className="btn-secondary lp-btn-lg" onClick={() => openAuth()}>
                <GoogleG /> Continue with Google
              </button>
            </div>
            <div className="lp-stats">
              <Stat value={stats?.internships} label="Open internships" />
              <Stat value={stats?.companies} label="Companies" />
              <Stat value={stats?.students} label="Students" />
            </div>
          </div>

          <div className="lp-hero-visual" aria-hidden="true">
            <div className="lp-mock glass-card">
              <div className="lp-mock-head">
                <div>
                  <div className="lp-mock-title">Frontend Developer Intern</div>
                  <div className="lp-mock-company">TechCorp · CSE</div>
                </div>
                <div className="lp-ring"><span>92%</span></div>
              </div>
              {[['React', 95], ['JavaScript', 90], ['Tailwind CSS', 80], ['Git', 70]].map(([s, v]) => (
                <div className="lp-bar-row" key={s}>
                  <span>{s}</span>
                  <div className="lp-bar"><div style={{ width: `${v}%` }} /></div>
                </div>
              ))}
              <div className="lp-mock-foot">
                <span className="lp-chip lp-chip-ok">✓ CGPA eligible</span>
                <span className="lp-chip lp-chip-ok">✓ 3 verified skills</span>
              </div>
            </div>
            <div className="lp-float lp-float-1 glass-card">🔔 Interview scheduled</div>
            <div className="lp-float lp-float-2 glass-card">🎉 You were shortlisted!</div>
          </div>
        </div>
      </section>

      {/* Internships */}
      <section id="internships" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Latest internships</h2>
            <p>Browse freely — sign in to see your personal match score and apply.</p>
          </div>

          <div className="lp-filters">
            <input className="form-input lp-search" type="search" placeholder="Search by title, company or skill…"
              value={query} onChange={e => setQuery(e.target.value)} aria-label="Search internships" />
            <div className="lp-chips">
              {departments.map(d => (
                <button key={d} className={`lp-filter-chip ${dept === d ? 'active' : ''}`} onClick={() => setDept(d)}>{d}</button>
              ))}
            </div>
          </div>

          {loadError ? (
            <div className="lp-empty">Couldn't load internships right now. Please refresh the page.</div>
          ) : !data ? (
            <div className="lp-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="lp-card lp-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="lp-empty">No internships match your search yet.</div>
          ) : (
            <div className="lp-grid">
              {filtered.map(i => (
                <article key={i._id} className="lp-card">
                  <div className="lp-card-top">
                    <div className="lp-avatar">{(i.companyName || '?').trim().charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="lp-card-title">{i.title}</h3>
                      <div className="lp-card-company">{i.companyName || 'Company'}</div>
                    </div>
                  </div>
                  {i.description && <p className="lp-card-desc">{i.description.split('\n')[0]}</p>}
                  <div className="lp-meta">
                    {i.department && <span>🏛 {i.department.toUpperCase()}</span>}
                    {i.minCGPA > 0 && <span>🎓 CGPA {i.minCGPA}+</span>}
                    {i.deadline && (
                      <span className={isClosed(i.deadline) ? 'lp-closed' : ''}>
                        ⏰ {isClosed(i.deadline) ? 'Closed' : `Apply by ${formatDate(i.deadline)}`}
                      </span>
                    )}
                  </div>
                  {i.requiredSkills?.length > 0 && (
                    <div className="lp-skills">
                      {i.requiredSkills.slice(0, 4).map(s => <span key={s.skill} className="lp-chip">{s.skill}</span>)}
                      {i.requiredSkills.length > 4 && <span className="lp-chip">+{i.requiredSkills.length - 4}</span>}
                    </div>
                  )}
                  <div className="lp-card-actions">
                    <button className="btn-secondary" onClick={() => openAuth({
                      reason: `Sign in to see how well you match “${i.title}”.`, redirectTo: '/internships',
                    })}>See my match</button>
                    <button className="btn-primary" disabled={isClosed(i.deadline)} onClick={() => openAuth({
                      reason: `Sign in to apply for “${i.title}” at ${i.companyName || 'this company'}.`, redirectTo: '/internships',
                    })}>Apply</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>How it works</h2>
            <p>From sign-up to offer in three simple steps.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map(s => (
              <div key={s.n} className="lp-step glass-card">
                <div className="lp-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Everything you need to land the right internship</h2>
          </div>
          <div className="lp-features">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feature">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies CTA */}
      <section id="companies" className="lp-section">
        <div className="lp-container">
          <div className="lp-cta glass-card">
            <div>
              <h2>Hiring interns?</h2>
              <p>Post internships, auto-shortlist the best-matched candidates and manage interviews — free.</p>
            </div>
            <button className="btn-primary lp-btn-lg" onClick={() => openAuth({
              defaultRole: 'company', reason: 'Create a company account to post internships and find top candidates.',
            })}>Post an internship</button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span className="gradient-text" style={{ fontWeight: 800 }}>IntelliMatch</span>
          <span>© {new Date().getFullYear()} IntelliMatch. Smarter internship matching.</span>
        </div>
      </footer>

      {/* Mounted only while open so each opening starts fresh */}
      {modal.open && <AuthModal open onClose={closeAuth} reason={modal.reason}
        defaultRole={modal.defaultRole || 'student'} redirectTo={modal.redirectTo} />}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="lp-stat">
      <div className="lp-stat-value">{value == null ? '—' : value}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
