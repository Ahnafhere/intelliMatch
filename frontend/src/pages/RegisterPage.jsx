import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, homePathFor } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [info, setInfo] = useState('');

  const roleLabels = {
    student: 'Student',
    company: 'Company / HR',
    university_admin: 'University Admin',
    system_admin: 'System Admin',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogle = (data) => {
    if (!data.token) return setInfo(data.message || 'Your account is awaiting admin approval.');
    login(data);
    navigate(homePathFor(data.role));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(ellipse at top right, rgba(14,165,233,0.12) 0%, transparent 60%), var(--bg-dark)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/"><h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: '800' }}>Create Account</h1></Link>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>Join IntelliMatch today</p>
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#7dd3fc',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
            {info}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[['student', '🎓 Student'], ['company', '🏢 Company']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setForm({ ...form, role: val })}
              className={form.role === val ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px' }}>
              {label}
            </button>
          ))}
        </div>
        <GoogleSignInButton role={form.role} onSuccess={handleGoogle} onError={setError} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          or register with email
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" required placeholder="John Doe"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {Object.entries(roleLabels).map(([val, label]) => (
                <option key={val} value={val} style={{ background: '#1e293b' }}>{label}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
