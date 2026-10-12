import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

// Client ID comes from the backend so it can be changed without rebuilding the frontend
let clientIdPromise;
const getClientId = () => {
  clientIdPromise ??= axios.get('/api/auth/google/config')
    .then(({ data }) => data.clientId)
    .catch(() => { clientIdPromise = undefined; return null; });
  return clientIdPromise;
};

let scriptPromise;
const loadGoogleScript = () => {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { scriptPromise = undefined; reject(); };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export default function GoogleSignInButton({ role = 'student', onSuccess, onError, text = 'continue_with' }) {
  const containerRef = useRef(null);
  const latest = useRef({ role, onSuccess, onError });
  latest.current = { role, onSuccess, onError };
  const [status, setStatus] = useState('loading'); // loading | ready | working | unavailable

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const clientId = await getClientId();
      if (!clientId) { if (!cancelled) setStatus('unavailable'); return; }
      try { await loadGoogleScript(); } catch { if (!cancelled) setStatus('unavailable'); return; }
      if (cancelled || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setStatus('working');
          try {
            const { data } = await axios.post('/api/auth/google', { credential, role: latest.current.role });
            latest.current.onSuccess?.(data);
          } catch (err) {
            latest.current.onError?.(err.response?.data?.message || 'Google sign-in failed');
          } finally {
            if (!cancelled) setStatus('ready');
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text,
        width: Math.min(containerRef.current.offsetWidth || 320, 400),
      });
      setStatus('ready');
    })();
    return () => { cancelled = true; };
  }, [text]);

  if (status === 'unavailable') return null;

  return (
    <div style={{ position: 'relative', minHeight: '44px', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
      {(status === 'loading' || status === 'working') && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '999px', background: 'rgba(15,23,42,0.85)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: '14px' }}>
          {status === 'working' ? 'Signing you in…' : 'Loading Google sign-in…'}
        </div>
      )}
    </div>
  );
}
