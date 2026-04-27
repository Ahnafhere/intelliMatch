import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getBadgeMeta } from '../utils/skillBadge';

function SkillWeightRow({ skill, weight, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <input
        className="form-input"
        placeholder="Skill name (e.g. React)"
        value={skill}
        onChange={(e) => onChange('skill', e.target.value)}
        style={{ flex: 2 }}
      />
      <div style={{ flex: 1 }}>
        <input
          className="form-input"
          type="number"
          min="1"
          max="10"
          placeholder="Weight (1-10)"
          value={weight}
          onChange={(e) => onChange('weight', e.target.value)}
        />
      </div>
      <button className="btn-danger" onClick={onRemove} style={{ whiteSpace: 'nowrap', padding: '10px' }}>
        x
      </button>
    </div>
  );
}

function InternshipPostForm({ editPost, initialData, onSaved, onSaveAsTemplate }) {
  const blank = {
    title: '',
    description: '',
    deadline: '',
    minCGPA: '',
    department: '',
    requiredSkills: [{ skill: '', weight: 5 }],
  };

  const [form, setForm] = useState(editPost || initialData || blank);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setForm(editPost || initialData || blank);
  }, [editPost, initialData]);

  const updateSkill = (idx, field, val) => {
    const updated = form.requiredSkills.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    setForm({ ...form, requiredSkills: updated });
  };

  const addSkill = () => setForm({ ...form, requiredSkills: [...form.requiredSkills, { skill: '', weight: 5 }] });
  const removeSkill = (idx) =>
    setForm({
      ...form,
      requiredSkills: form.requiredSkills.filter((_, i) => i !== idx),
    });

  const sanitizePayload = (payload) => ({
    ...payload,
    requiredSkills: (payload.requiredSkills || [])
      .filter((s) => s.skill && s.skill.trim())
      .map((s) => ({ skill: s.skill.trim(), weight: Number(s.weight) || 1 })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const payload = sanitizePayload(form);
      if (editPost) {
        await axios.put(`/api/internship/${editPost._id}`, payload);
      } else {
        await axios.post('/api/internship', payload);
      }
      setMsg('Saved successfully');
      setTimeout(() => {
        setMsg('');
        if (onSaved) onSaved();
      }, 900);
      if (!editPost) setForm(blank);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to save internship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editPost ? 'Edit Internship' : 'Post Internship'}</h2>
      {msg && (
        <div className="metric-note" style={{ color: msg.toLowerCase().includes('saved') ? '#4ade80' : '#f87171' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Department</label>
          <input
            className="form-input"
            value={form.department || ''}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Deadline</label>
          <input
            className="form-input"
            type="date"
            value={form.deadline ? form.deadline.slice(0, 10) : ''}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Minimum CGPA</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="4"
            step="0.01"
            value={form.minCGPA || ''}
            onChange={(e) => setForm({ ...form, minCGPA: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          rows="3"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div>
        <label className="form-label" style={{ marginBottom: '10px' }}>
          Required Skills and Weights
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {form.requiredSkills.map((s, i) => (
            <SkillWeightRow
              key={i}
              skill={s.skill}
              weight={s.weight}
              onChange={(field, val) => updateSkill(i, field, val)}
              onRemove={() => removeSkill(i)}
            />
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={addSkill} style={{ marginTop: '10px', fontSize: '13px' }}>
          + Add Skill
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        {!editPost && (
          <button type="button" className="btn-secondary" onClick={() => onSaveAsTemplate && onSaveAsTemplate(form)}>
            Save As Template
          </button>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          {editPost && (
            <button type="button" className="btn-secondary" onClick={() => onSaved && onSaved()}>
              Cancel
            </button>
          )}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </form>
  );
}

const statusOptions = ['Pending', 'Shortlisted', 'Rejected', 'Selected'];

function CandidatesPanel({ internship, candidates, loading, onReload }) {
  const [topN, setTopN] = useState(5);
  const [minScore, setMinScore] = useState(60);
  const [running, setRunning] = useState(false);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/application/${id}/status`, { status });
      onReload();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const runAutoShortlist = async () => {
    setRunning(true);
    try {
      const { data } = await axios.post(`/api/application/internship/${internship._id}/auto-shortlist`, {
        topN,
        minimumRecommendationScore: minScore,
      });
      window.alert(data.message);
      onReload();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to auto-shortlist');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="glass-card" style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
        <div>
          <label className="form-label">Top N Candidates</label>
          <input className="form-input" type="number" min="1" max="50" value={topN} onChange={(e) => setTopN(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Minimum Smart Score</label>
          <input className="form-input" type="number" min="0" max="100" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Ranking Logic</label>
          <div className="metric-note">recommendationScore then matchScore then CGPA</div>
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button className="btn-primary" onClick={runAutoShortlist} disabled={running}>
            {running ? 'Running...' : 'Auto Shortlist'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No candidates applied to this internship yet.
        </div>
      ) : (
        candidates.map((app) => {
          const badgeMeta = getBadgeMeta(app.endorsementBadge);

          return (
            <div key={app._id} className="glass-card ranking-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="rank-pill">#{app.rank}</span>
                    <h3 style={{ fontSize: '17px' }}>{app.studentId?.name || 'Student'}</h3>
                    <span className="badge badge-shortlisted">Smart {app.recommendationScore}%</span>
                    <span className="skill-tag" style={badgeMeta.style}>{badgeMeta.label} Badge</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '10px' }}>
                    {app.studentId?.email || 'N/A'} | Match {app.matchScore}% | CGPA {Number(app.cgpaAtApply || 0).toFixed(2)}
                  </p>
                  <div className="metric-note" style={{ marginBottom: '8px' }}>
                    Missing skills: {(app.skillGapReport?.missingSkills || []).map((x) => x.skill).join(', ') || 'None'}
                  </div>
                  {(app.skillGapReport?.missingSkills || []).slice(0, 2).map((missing) => (
                    <div key={missing.skill} className="metric-note" style={{ marginTop: '6px' }}>
                      Learn {missing.skill}: {(missing.recommendedLearningPaths || []).join(' | ')}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '190px' }}>
                  <label className="form-label">Application Status</label>
                  <select className="form-input" value={app.status} onChange={(e) => updateStatus(app._id, e.target.value)}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function CompanyDashboard() {
  const [view, setView] = useState('list');
  const [posts, setPosts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editPost, setEditPost] = useState(null);
  const [postPrefill, setPostPrefill] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedInternship, setSelectedInternship] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/internship/company');
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data } = await axios.get('/api/internship/template/company');
      setTemplates(data);
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    loadPosts();
    loadTemplates();
  }, []);

  const deletePost = async (id) => {
    if (!window.confirm('Delete this internship?')) return;
    try {
      await axios.delete(`/api/internship/${id}`);
      loadPosts();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const duplicatePost = async (id) => {
    try {
      await axios.post(`/api/internship/${id}/duplicate`, {});
      loadPosts();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Duplicate failed');
    }
  };

  const savePostAsTemplate = async (post) => {
    const templateName = window.prompt('Template name');
    if (!templateName) return;

    try {
      await axios.post(`/api/internship/${post._id}/save-template`, { templateName });
      loadTemplates();
      window.alert('Template saved');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Template save failed');
    }
  };

  const saveFormAsTemplate = async (form) => {
    const templateName = window.prompt('Template name');
    if (!templateName) return;

    try {
      await axios.post('/api/internship/template', {
        templateName,
        title: form.title,
        description: form.description,
        minCGPA: form.minCGPA,
        department: form.department,
        requiredSkills: (form.requiredSkills || [])
          .filter((s) => s.skill && s.skill.trim())
          .map((s) => ({ skill: s.skill.trim(), weight: Number(s.weight) || 1 })),
      });
      loadTemplates();
      window.alert('Template saved');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Template save failed');
    }
  };

  const fetchCandidates = async (internshipId) => {
    setCandidatesLoading(true);
    try {
      const { data } = await axios.get(`/api/application/internship/${internshipId}`);
      setCandidates(data);
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const openCandidates = (post) => {
    setSelectedInternship(post);
    setView('candidates');
    fetchCandidates(post._id);
  };

  const startFromTemplate = (template) => {
    setEditPost(null);
    setPostPrefill({
      title: template.title,
      description: template.description,
      minCGPA: template.minCGPA,
      department: template.department,
      deadline: '',
      requiredSkills: template.requiredSkills || [],
    });
    setView('post');
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>
            IntelliMatch
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Company Portal</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { key: 'list', label: 'My Postings', icon: 'List' },
            { key: 'post', label: 'New Posting', icon: 'Post' },
            { key: 'templates', label: 'Templates', icon: 'Tpl' },
            { key: 'candidates', label: 'Candidates', icon: 'Rank' },
            { key: 'insights', label: 'Analytics', icon: 'Data', external: '/company-insights' },
            { key: 'interviews', label: 'Interviews', icon: 'Slot', external: '/interviews' },
            { key: 'notifications', label: 'Notifications', icon: 'Bell', external: '/notifications' },
          ].map((link) => (
            <a
              key={link.key}
              href={link.external || '#'}
              onClick={link.external ? undefined : (e) => {
                e.preventDefault();
                setView(link.key);
                if (link.key !== 'post') setPostPrefill(null);
              }}
              className={`nav-link${view === link.key ? ' active' : ''}`}
            >
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>
        <hr className="divider" />
        <button
          className="btn-danger"
          onClick={() => {
            localStorage.removeItem('intellimatch_user');
            window.location.href = '/login';
          }}
          style={{ width: '100%' }}
        >
          Sign Out
        </button>
      </aside>

      <main className="content-area">
        {view === 'post' && (
          <div>
            <h1 className="page-title">Create Internship</h1>
            <p className="page-subtitle">Define weighted skill requirements and optionally save reusable templates.</p>
            <InternshipPostForm
              editPost={editPost}
              initialData={postPrefill}
              onSaved={() => {
                setView('list');
                setEditPost(null);
                setPostPrefill(null);
                loadPosts();
              }}
              onSaveAsTemplate={saveFormAsTemplate}
            />
          </div>
        )}

        {view === 'templates' && (
          <div>
            <h1 className="page-title">Requirement Templates</h1>
            <p className="page-subtitle">Reuse, duplicate, and modify requirement structures for faster hiring cycles.</p>
            {templates.length === 0 ? (
              <div className="glass-card" style={{ color: 'var(--text-muted)' }}>
                No templates yet. Save one from a posting or from the post form.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {templates.map((template) => (
                  <div key={template._id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ marginBottom: '6px' }}>{template.templateName}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          {template.title} {template.department ? `| ${template.department}` : ''}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(template.requiredSkills || []).map((s) => (
                            <span key={`${template._id}-${s.skill}`} className="skill-tag" style={{ fontSize: '12px' }}>
                              {s.skill} w:{s.weight}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignSelf: 'start' }}>
                        <button className="btn-secondary" onClick={() => startFromTemplate(template)}>
                          Use Template
                        </button>
                        <button
                          className="btn-primary"
                          onClick={async () => {
                            try {
                              await axios.post(`/api/internship/template/${template._id}/create-post`, {
                                deadline: '',
                              });
                              loadPosts();
                              window.alert('Internship post created from template');
                            } catch (err) {
                              window.alert(err.response?.data?.message || 'Failed to create post from template');
                            }
                          }}
                        >
                          Quick Create
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'candidates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 className="page-title">Candidate Ranking</h1>
                <p className="page-subtitle">Ranked by smart recommendation score with skill-gap diagnostics.</p>
              </div>
              <select
                className="form-input"
                style={{ maxWidth: '340px' }}
                value={selectedInternship?._id || ''}
                onChange={(e) => {
                  const next = posts.find((p) => p._id === e.target.value);
                  setSelectedInternship(next || null);
                  if (next) fetchCandidates(next._id);
                }}
              >
                <option value="">Select internship</option>
                {posts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {!selectedInternship ? (
              <div className="glass-card" style={{ color: 'var(--text-muted)' }}>
                Select an internship to view ranked candidates.
              </div>
            ) : (
              <CandidatesPanel
                internship={selectedInternship}
                candidates={candidates}
                loading={candidatesLoading}
                onReload={() => fetchCandidates(selectedInternship._id)}
              />
            )}
          </div>
        )}

        {view === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 className="page-title">My Postings</h1>
                <p className="page-subtitle">{posts.length} internship{posts.length !== 1 ? 's' : ''} posted</p>
              </div>
              <button className="btn-primary" onClick={() => setView('post')}>
                + New Post
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div className="spinner"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                No internships posted yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {posts.map((p) => (
                  <div key={p._id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>{p.title}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          {p.department && <span style={{ marginRight: '16px' }}>Dept: {p.department}</span>}
                          {p.deadline && <span style={{ marginRight: '16px' }}>Deadline: {new Date(p.deadline).toLocaleDateString()}</span>}
                          {Number(p.minCGPA) > 0 && <span>Min CGPA: {p.minCGPA}</span>}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(p.requiredSkills || []).map((s) => (
                            <span key={s.skill} className="skill-tag" style={{ fontSize: '12px' }}>
                              {s.skill} w:{s.weight}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => openCandidates(p)}>
                          Candidates
                        </button>
                        <button className="btn-secondary" onClick={() => savePostAsTemplate(p)}>
                          Save Template
                        </button>
                        <button className="btn-secondary" onClick={() => duplicatePost(p._id)}>
                          Duplicate
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setEditPost(p);
                            setPostPrefill(null);
                            setView('post');
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => deletePost(p._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
