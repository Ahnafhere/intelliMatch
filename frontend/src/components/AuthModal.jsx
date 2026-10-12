import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import '../styles/Landing.css';

export default function AuthModal({ open, onClose, reason, defaultRole = 'student', redirectTo }) {
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSuccess = (data) => {
    if (!data.token) {
      setInfo(data.message || 'Your account is awaiting admin approval.');
      return;
    }
    login(data);
    const target = redirectTo && (data.role === 'student' || redirectTo !== '/internships')
      ? redirectTo
      : homePathFor(data.role);
    navigate(target);
  };

  return (
    <div className="lp-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lp-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button className="lp-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 id="auth-modal-title" className="lp-modal-title">Sign in to continue</h2>
        <p className="lp-modal-sub">{reason || 'Join IntelliMatch to get matched with internships that fit your skills.'}</p>

        <div className="lp-role-label">New here? I'm joining as</div>
        <div className="lp-role-toggle" role="radiogroup">
          {[['student', '🎓 Student'], ['company', '🏢 Company']].map(([val, label]) => (
            <button key={val} type="button" role="radio" aria-checked={role === val}
              className={role === val ? 'active' : ''} onClick={() => setRole(val)}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="lp-alert lp-alert-error">{error}</div>}
        {info && <div className="lp-alert lp-alert-info">{info}</div>}

        <GoogleSignInButton role={role} onSuccess={handleSuccess} onError={setError} />

        <div className="lp-divider"><span>or</span></div>

        <div className="lp-modal-actions">
          <Link to="/login" className="btn-secondary lp-btn-block">Sign in with email</Link>
          <Link to="/register" className="btn-primary lp-btn-block">Create account</Link>
        </div>
        <p className="lp-modal-fine">Existing accounts sign in with the same email — your role is kept.</p>
      </div>
    </div>
  );
}
