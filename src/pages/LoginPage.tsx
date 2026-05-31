import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      return;
    }

    const isRegister = mode === 'register';
    if (isRegister && username.length < 2) {
      setError('用户名至少 2 个字符');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    if (!isRegister && password.length < 1) {
      setError('请输入密码');
      return;
    }
    if (isRegister) {
      const p2 = password2.trim();
      if (!p2) {
        setError('请再次输入密码');
        return;
      }
      if (password !== p2) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate('/chat', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        if (axiosErr.response?.status === 401 || axiosErr.response?.status === 409) {
          setError(axiosErr.response?.data?.detail || '操作失败');
        } else if (axiosErr.response?.status === 429) {
          setError('操作太频繁，请稍后再试');
        } else {
          setError('服务器错误，请稍后重试');
        }
      } else if (err instanceof Error) {
        setError('连接不上后端服务器');
      } else {
        setError('操作失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const eyeSvg = (isOpen: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {isOpen ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', paddingRight: 48,
    borderRadius: 10, fontSize: 15,
    background: 'var(--bg-soft)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div className="animate-fade-in" style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-soft)',
        borderRadius: 20, padding: 40,
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          textAlign: 'center', marginBottom: 32,
          fontSize: 36, fontFamily: "'ZCOOL KuaiLe', cursive",
          color: 'var(--text)',
        }}>
          🐱 先贤智在
        </div>

        {/* Login/Register Tabs */}
        <div style={{
          display: 'flex', marginBottom: 24,
          background: 'var(--card)', borderRadius: 10, padding: 4,
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              fontSize: 15, fontWeight: 500,
              color: mode === 'login' ? '#fff' : 'var(--text-dim)',
              background: mode === 'login' ? 'var(--accent)' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              fontSize: 15, fontWeight: 500,
              color: mode === 'register' ? '#fff' : 'var(--text-dim)',
              background: mode === 'register' ? 'var(--accent)' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                padding: 4, lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer',
                opacity: 0.6,
              }}
              tabIndex={-1}
            >
              {eyeSvg(showPw)}
            </button>
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div style={{ marginBottom: 8, position: 'relative' }}>
              <input
                type={showPw2 ? 'text' : 'password'}
                placeholder="确认密码"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPw2(!showPw2)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  padding: 4, lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer',
                  opacity: 0.6,
                }}
                tabIndex={-1}
              >
                {eyeSvg(showPw2)}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              color: '#e74c3c', fontSize: 13,
              marginBottom: 8, padding: '8px 12px',
              background: 'rgba(231,76,60,0.1)', borderRadius: 8,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '12px 0',
              borderRadius: 10, fontSize: 16, fontWeight: 600,
              color: '#fff',
              background: isSubmitting ? 'var(--text-dim)' : 'var(--accent)',
              transition: 'all 0.15s ease',
              marginTop: 16,
            }}
          >
            {isSubmitting ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
