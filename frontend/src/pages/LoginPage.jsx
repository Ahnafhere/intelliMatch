import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, homePathFor } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data);
      navigate(homePathFor(data.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleGoogle = (data) => {
    if (!data.token) return setError(data.message || 'Your account is awaiting admin approval.');
    login(data);
    navigate(homePathFor(data.role));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.15) 0%, transparent 60%), var(--bg-dark)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/"><h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: '800' }}>IntelliMatch</h1></Link>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>Sign in to your account</p>
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <GoogleSignInButton role={'student'} onSuccess={handleGoogle} onError={setError} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          or use email
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          No account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
