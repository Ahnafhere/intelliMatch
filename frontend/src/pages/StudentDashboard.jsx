import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const badgeMeta = {
  gold: { label: 'Gold', style: { background: 'rgba(234,179,8,0.18)', borderColor: 'rgba(234,179,8,0.45)', color: '#fde68a' } },
  silver: { label: 'Silver', style: { background: 'rgba(148,163,184,0.2)', borderColor: 'rgba(148,163,184,0.45)', color: '#e2e8f0' } },
  bronze: { label: 'Bronze', style: { background: 'rgba(180,83,9,0.2)', borderColor: 'rgba(180,83,9,0.45)', color: '#fdba74' } },
};

// === Skill Tag Input ===
function SkillTagInput({ skills, onChange }) {
  const [input, setInput] = useState('');
  const add = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const skillName = input.trim();
      // Check if skill already exists
      if (!skills.find(s => (s.name || s) === skillName)) {
        // Create skill object for consistency
        const newSkill = typeof skills[0] === 'object' 
          ? { name: skillName, proficiency: 'Intermediate', endorsements: 0, addedAt: new Date().toISOString() }
          : skillName;
        onChange([...skills, newSkill]);
      }
      setInput('');
    }
  };
  const remove = (idx) => onChange(skills.filter((_, i) => i !== idx));
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {skills.map((s, i) => {
          const skillName = typeof s === 'object' ? s.name : s;
          const proficiency = typeof s === 'object' ? s.proficiency : 'Intermediate';
          return (
            <span key={i} className="skill-tag" title={proficiency}>
              {skillName} <span className="remove" onClick={() => remove(i)}>×</span>
            </span>
          );
        })}
      </div>
      <input className="form-input" placeholder="Type skill and press Enter..."
        value={input} onChange={e => setInput(e.target.value)} onKeyDown={add} />
    </div>
  );
}

// === Profile Form ===
function ProfileForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', cgpa: '', department: '', graduationYear: '', certifications: [], projects: [], skills: [] });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [certInput, setCertInput] = useState('');
  const [projInput, setProjInput] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/student/profile/me')
      .then(r => {
        // Ensure skills are in object format
        const skillsData = (r.data.skills || []).map(s => 
          typeof s === 'object' ? s : { name: s, proficiency: 'Intermediate', endorsements: 0, addedAt: new Date().toISOString() }
        );
        setForm(f => ({ ...f, ...r.data, skills: skillsData }));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setMsg('');
    try {
      const submitData = {
        ...form,
        certifications: certInput ? [...(form.certifications || []), certInput] : form.certifications,
        projects: projInput ? [...(form.projects || []), projInput] : form.projects,
        // Ensure skills are in the right format (objects with name, proficiency, etc)
        skills: (form.skills || []).map(s => 
          typeof s === 'object' ? s : { name: s, proficiency: 'Intermediate', endorsements: 0, addedAt: new Date().toISOString() }
        )
      };
      
      await axios.put('/api/student/profile', submitData);
      setMsg('✅ Profile saved successfully!');
      // Clear temporary inputs
      setCertInput('');
      setProjInput('');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Error saving'));
    } finally { 
      setLoading(false); 
    }
  };

  const importGitHubSkills = async () => {
    if (!githubUsername.trim()) {
      setMsg('❌ Please enter a GitHub username');
      return;
    }
    
    setImportLoading(true);
    setMsg('');
    try {
      const response = await axios.post(`/api/student/github-skills/${githubUsername}`, {});
      
      // Safely get the skill objects from the response
      if (!response.data || !response.data.profile) {
        setMsg('❌ Invalid response from server');
        setImportLoading(false);
        return;
      }
      
      const allProfileSkills = response.data.profile.skills || [];
      const importedCount = response.data.importedCount || 0;
      const fetchedSkills = response.data.fetchedSkills || [];
      
      // Update form with all skills from profile
      setForm(f => ({
        ...f,
        skills: allProfileSkills
      }));
      
      // Show what was fetched from GitHub
      const fetchedNames = fetchedSkills.map(s => (typeof s === 'object' ? s.name : s)).join(', ');
      
      if (importedCount > 0) {
        setMsg(`✅ Successfully imported from GitHub! ${importedCount} new skills added. Fetched: ${fetchedNames}`);
      } else {
        setMsg(`ℹ️ All skills from GitHub were already in your profile. Fetched: ${fetchedNames}`);
      }
      setGithubUsername('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to import from GitHub';
      setMsg('❌ ' + errorMsg);
    } finally {
      setImportLoading(false);
    }
  };

  const addList = (field, val, setVal) => {
    if (val.trim()) { setForm(f => ({ ...f, [field]: [...(f[field] || []), val.trim()] })); setVal(''); }
  };
  const removeList = (field, idx) => setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Keep your academic profile up to date for better matches</p>
      {msg && <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
        background: msg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        color: msg.startsWith('✅') ? '#4ade80' : '#f87171', border: `1px solid ${msg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
        {msg}
      </div>}
      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label className="form-label">Full Name *</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="form-label">CGPA (0–4)</label>
            <input className="form-input" type="number" min="0" max="4" step="0.01" value={form.cgpa}
              onChange={e => setForm({ ...form, cgpa: e.target.value })} /></div>
          <div><label className="form-label">Department</label>
            <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
          <div><label className="form-label">Graduation Year</label>
            <input className="form-input" type="number" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })} /></div>
        </div>
        <div>
          <label className="form-label">Technical Skills <span style={{ color: 'var(--text-muted)' }}>(press Enter/comma to add)</span></label>
          <SkillTagInput skills={form.skills || []} onChange={s => setForm({ ...form, skills: s })} />
        </div>
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '16px' }}>
          <label className="form-label" style={{ marginBottom: '12px' }}>📱 Import Skills from GitHub</label>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Automatically extract your programming skills and technologies from your public GitHub profile.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              className="form-input" 
              placeholder="Enter GitHub username (e.g. torvalds)" 
              value={githubUsername} 
              onChange={e => setGithubUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && importGitHubSkills()}
              disabled={importLoading}
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="btn-primary" 
              onClick={importGitHubSkills}
              disabled={importLoading || !githubUsername.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {importLoading ? '🔄 Importing...' : '📂 Import'}
            </button>
          </div>
        </div>
        <div>
          <label className="form-label">Certifications</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input" placeholder="e.g. AWS Certified Developer" value={certInput} onChange={e => setCertInput(e.target.value)} />
            <button type="button" className="btn-secondary" onClick={() => addList('certifications', certInput, setCertInput)} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(form.certifications || []).map((c, i) => (
              <span key={i} className="skill-tag">{c} <span className="remove" onClick={() => removeList('certifications', i)}>×</span></span>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Projects</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input" placeholder="e.g. E-commerce web app" value={projInput} onChange={e => setProjInput(e.target.value)} />
            <button type="button" className="btn-secondary" onClick={() => addList('projects', projInput, setProjInput)} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(form.projects || []).map((p, i) => (
              <span key={i} className="skill-tag" style={{ background: 'rgba(14,165,233,0.1)', borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8' }}>
                {p} <span className="remove" onClick={() => removeList('projects', i)}>×</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Verified Skill Badges</label>
          {(form.verifiedSkills || []).length === 0 ? (
            <p className="metric-note">No verified badges yet. Company or university admin verification will appear here.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(form.verifiedSkills || []).map((entry, idx) => {
                const badge = badgeMeta[entry.badgeLevel || 'bronze'] || badgeMeta.bronze;
                return (
                  <div key={`${entry.skill}_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="skill-tag" style={{ background: 'rgba(34,197,94,0.14)', borderColor: 'rgba(34,197,94,0.45)', color: '#86efac' }}>{entry.skill}</span>
                    <span className="skill-tag" style={badge.style}>{badge.label} Badge</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </form>
    </div>
  );
}

// === CV Upload ===
function CVUploadSection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [related, setRelated] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [saved, setSaved] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setExtracted(null); setSaved(false);
    const formData = new FormData();
    formData.append('cv', file);
    try {
      const { data } = await axios.post('/api/student/upload-cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setExtracted(data.extractedSkills);
      setConfirmed(data.extractedSkills);
      setRelated(data.relatedSkills || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    try {
      await axios.post('/api/student/confirm-skills', { skills: confirmed });
      setSaved(true);
    } catch { alert('Failed to save skills'); }
  };

  const toggleSkill = (s) => setConfirmed(c => c.includes(s) ? c.filter(x => x !== s) : [...c, s]);

  return (
    <div>
      <h1 className="page-title">CV Upload & Skill Extraction</h1>
      <p className="page-subtitle">Upload your PDF CV to automatically extract and add your skills</p>
      <div className="glass-card">
        <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '20px',
          background: file ? 'rgba(99,102,241,0.05)' : 'transparent', transition: 'all 0.2s' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
            {file ? `Selected: ${file.name}` : 'Drag & drop or click to select your CV (PDF only)'}
          </p>
          <input id="cv-file-input" type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
          <label htmlFor="cv-file-input" className="btn-secondary" style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', display: 'inline-block' }}>
            Choose PDF
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={handleUpload} disabled={!file || loading} style={{ padding: '10px 32px' }}>
            {loading ? <><span className="spinner" style={{ width: '18px', height: '18px', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}></span>Parsing CV...</> : '🔍 Extract Skills'}
          </button>
        </div>

        {extracted && (
          <div style={{ marginTop: '28px' }}>
            <hr className="divider" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Detected Skills <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>(click to toggle selection)</span>
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {extracted.map(s => (
                <span key={s} onClick={() => toggleSkill(s)} className="skill-tag"
                  style={{ cursor: 'pointer', opacity: confirmed.includes(s) ? 1 : 0.35,
                    background: confirmed.includes(s) ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)' }}>
                  {s} {confirmed.includes(s) ? '✓' : ''}
                </span>
              ))}
            </div>

            {related.length > 0 && (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>💡 Related skills you might want to add:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {related.map(s => (
                    <span key={s} onClick={() => !confirmed.includes(s) && setConfirmed(c => [...c, s])} className="skill-tag"
                      style={{ cursor: 'pointer', background: 'rgba(14,165,233,0.1)', borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8' }}>
                      + {s}
                    </span>
                  ))}
                </div>
              </>
            )}

            {saved ? (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', textAlign: 'center' }}>
                ✅ Skills saved to your profile!
              </div>
            ) : (
              <button className="btn-primary" onClick={handleConfirm} disabled={confirmed.length === 0}>
                Confirm & Save {confirmed.length} Skill{confirmed.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// === Student Dashboard ===
export default function StudentDashboard() {
  const [view, setView] = useState('profile');

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Student Portal</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { key: 'profile', label: 'My Profile', icon: '👤' },
            { key: 'cv', label: 'CV Upload', icon: '📄' },
            { key: 'insights', label: 'Skill Trends', icon: '📈', external: '/student-insights' },
            { key: 'search', label: 'Browse Internships', icon: '🔍', external: '/internships' },
            { key: 'apps', label: 'My Applications', icon: '📨', external: '/my-applications' },
            { key: 'feedback', label: 'Feedback Portal', icon: '💬', external: '/student-feedback' },
            { key: 'interviews', label: 'Interviews', icon: '🗓️', external: '/interviews' },
            { key: 'notifications', label: 'Notifications', icon: '🔔', external: '/notifications' },
          ].map(link => (
            <a key={link.key} href={link.external || '#'} onClick={link.external ? undefined : (e) => { e.preventDefault(); setView(link.key); }}
              className={`nav-link${view === link.key ? ' active' : ''}`}>
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={() => { localStorage.removeItem('intellimatch_user'); window.location.href = '/login'; }} style={{ width: '100%' }}>Sign Out</button>
      </aside>
      <main className="content-area">
        {view === 'profile' && <ProfileForm />}
        {view === 'cv' && <CVUploadSection />}
      </main>
    </div>
  );
}
