import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { THEME_ICONS, THEME_LABELS } from '../types/theme';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { getCreatedAtFromToken } from '../utils/jwt';
import { getToken, getServerUrl } from '../utils/storage';

const settingBtnStyle: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-light)',
  color: 'var(--text)', fontSize: 15, cursor: 'pointer',
};

export function MePage() {
  const { user, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const clearHistory = useChatStore((s) => s.clearHistory);
  const personaId = usePersonaStore((s) => s.currentPersonaId);

  // ── Modals ──
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // ── Password form state ──
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // ── Registration date from JWT ──
  const [regDate, setRegDate] = useState('');
  useEffect(() => {
    const token = getToken();
    if (token) {
      const created = getCreatedAtFromToken(token);
      setRegDate(created ? new Date(created).toLocaleDateString('zh-CN') : '');
    }
  }, []);

  // ── Handlers ──
  const handleClearHistory = async () => {
    await clearHistory(personaId);
    setShowClearModal(false);
    showToast('聊天记录已清除', 'success');
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!oldPw || !newPw || !confirmPw) { setPwError('请填写所有密码字段'); return; }
    if (newPw.length < 8) { setPwError('新密码至少 8 位'); return; }
    if (newPw !== confirmPw) { setPwError('两次输入的新密码不一致'); return; }
    setPwSubmitting(true);
    try {
      const token = getToken();
      if (!token) { setPwError('未登录'); setPwSubmitting(false); return; }
      const response = await fetch(`${getServerUrl()}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      if (response.ok) {
        showToast('密码修改成功');
        setShowPasswordForm(false);
        setOldPw(''); setNewPw(''); setConfirmPw('');
      } else {
        const data = await response.json().catch(() => null);
        setPwError(data?.detail || '密码修改失败');
      }
    } catch {
      setPwError('连接不上后端服务器');
    }
    setPwSubmitting(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    background: 'var(--bg-soft)', color: 'var(--text)',
    border: '1px solid var(--border)', outline: 'none', marginBottom: 12,
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 24px 28px' }}>
      {/* ── Profile Card ── */}
      <div style={{
        background: 'var(--card)', borderRadius: 16, padding: 24,
        border: '1px solid var(--border)', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: '#fff',
          fontFamily: "'ZCOOL KuaiLe', cursive",
        }}>
          {user?.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            {user?.username || '未知用户'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>ID: {user?.id || '-'}</div>
          {regDate && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>注册时间：{regDate}</div>
          )}
        </div>
      </div>

      {/* ── Settings ── */}
      <div style={{
        background: 'var(--card)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {/* Theme */}
        <button onClick={cycleTheme} style={settingBtnStyle}>
          <span>🎨 主题</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            {THEME_ICONS[theme]} {THEME_LABELS[theme]}
          </span>
        </button>

        {/* Change Password */}
        <button onClick={() => setShowPasswordForm(!showPasswordForm)} style={settingBtnStyle}>
          <span>🔒 修改密码</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>›</span>
        </button>
        {showPasswordForm && (
          <div style={{ padding: '0 20px 20px' }}>
            <input type="password" placeholder="旧密码" value={oldPw} onChange={(e) => setOldPw(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="新密码（至少8位）" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="确认新密码" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} style={inputStyle} />
            {pwError && <div style={{ color: '#e74c3c', fontSize: 12, marginBottom: 8 }}>{pwError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleChangePassword} disabled={pwSubmitting} style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                background: 'var(--accent)', color: '#fff', fontSize: 14,
                fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>
                {pwSubmitting ? '修改中...' : '确认修改'}
              </button>
              <button onClick={() => { setShowPasswordForm(false); setPwError(''); }} style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                background: 'var(--bg-soft)', color: 'var(--text)', fontSize: 14,
                border: 'none', cursor: 'pointer',
              }}>
                取消
              </button>
            </div>
          </div>
        )}

        {/* Clear History */}
        <button onClick={() => setShowClearModal(true)} style={settingBtnStyle}>
          <span>🗑️ 清除当前聊天记录</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>›</span>
        </button>

        {/* Privacy Policy */}
        <button onClick={() => setShowPrivacyModal(true)} style={settingBtnStyle}>
          <span>📄 隐私政策</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>›</span>
        </button>

        {/* Terms */}
        <button onClick={() => setShowTermsModal(true)} style={settingBtnStyle}>
          <span>📋 用户协议</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>›</span>
        </button>

        {/* About */}
        <button onClick={() => setShowAboutModal(true)} style={settingBtnStyle}>
          <span>ℹ️ 关于</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>›</span>
        </button>

        {/* Logout */}
        <button onClick={() => setShowLogoutModal(true)} style={{
          ...settingBtnStyle, color: '#e74c3c', borderBottom: 'none',
        }}>
          <span>🚪 退出登录</span>
          <span style={{ fontSize: 13 }}>›</span>
        </button>
      </div>

      {/* ── Modals ── */}

      {/* Clear History */}
      <Modal isOpen={showClearModal} title="确认清除" onClose={() => setShowClearModal(false)} footer={
        <>
          <button onClick={() => setShowClearModal(false)} style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--bg-soft)',
            color: 'var(--text)', border: 'none', cursor: 'pointer',
          }}>取消</button>
          <button onClick={handleClearHistory} style={{
            padding: '8px 20px', borderRadius: 8, background: '#e74c3c',
            color: '#fff', border: 'none', cursor: 'pointer',
          }}>确认清除</button>
        </>
      }>
        确定要清除当前人格的所有聊天记录吗？此操作不可恢复。
      </Modal>

      {/* Logout */}
      <Modal isOpen={showLogoutModal} title="确认退出" onClose={() => setShowLogoutModal(false)} footer={
        <>
          <button onClick={() => setShowLogoutModal(false)} style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--bg-soft)',
            color: 'var(--text)', border: 'none', cursor: 'pointer',
          }}>取消</button>
          <button onClick={handleLogout} style={{
            padding: '8px 20px', borderRadius: 8, background: '#e74c3c',
            color: '#fff', border: 'none', cursor: 'pointer',
          }}>退出登录</button>
        </>
      }>
        确定要退出登录吗？
      </Modal>

      {/* Privacy Policy */}
      <Modal isOpen={showPrivacyModal} title="隐私政策" onClose={() => setShowPrivacyModal(false)}>
        <div style={{ lineHeight: 1.8, fontSize: 14 }}>
          <p>先贤智在尊重并保护您的隐私。</p>
          <p>• 您的用户名和密码仅用于身份验证，密码使用 PBKDF2 加密存储</p>
          <p>• 聊天记录存储在本地和服务器端，仅您本人可访问</p>
          <p>• 我们不会将您的数据分享给任何第三方</p>
          <p>• 您可以随时在"我的"页面清除聊天记录</p>
        </div>
      </Modal>

      {/* Terms */}
      <Modal isOpen={showTermsModal} title="用户协议" onClose={() => setShowTermsModal(false)}>
        <div style={{ lineHeight: 1.8, fontSize: 14 }}>
          <p>使用先贤智在即表示您同意：</p>
          <p>• 不发送违法、暴力、色情等不当内容</p>
          <p>• AI 回复仅供参考，不构成任何专业建议</p>
          <p>• 不利用本服务进行任何违反法律法规的活动</p>
          <p>• 我们保留终止服务的权利</p>
        </div>
      </Modal>

      {/* About */}
      <Modal isOpen={showAboutModal} title="关于先贤智在" onClose={() => setShowAboutModal(false)}>
        <div style={{ lineHeight: 1.8, fontSize: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐱</div>
          <p><strong>先贤智在 v2.0</strong></p>
          <p>AI 桌宠 · React + TypeScript</p>
          <p>Powered by DeepSeek</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 12 }}>
            与先贤智者对话，与萌宠相伴
          </p>
        </div>
      </Modal>
    </div>
  );
}
