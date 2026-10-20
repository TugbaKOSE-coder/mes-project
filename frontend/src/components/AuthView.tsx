import React, { useState } from 'react';
import {
  Cpu, Lock, User as UserIcon, Mail, Shield, CheckCircle2,
  AlertCircle, ArrowLeft, KeyRound
} from 'lucide-react';
import { api } from '../api';
import { User, UserRole } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('OPERATOR');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    resetMessages();
    setLoading(true);

    const res = await api.login(loginUsername, loginPassword);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Giriş yapılamadı!');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const res = await api.register({
      full_name: regFullName,
      username: regUsername,
      email: regEmail,
      password: regPassword,
      role: regRole
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Kayıt başarıyla oluşturuldu! Şimdi bu bilgilerle giriş yapabilirsiniz.');
      setLoginUsername(regUsername);
      setLoginPassword(regPassword);
      setAuthMode('login');
    } else {
      setErrorMsg(res.error || 'Kayıt işlemi başarısız!');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (newPassword !== confirmPassword) {
      setErrorMsg('Girdiğiniz yeni şifreler birbiriyle eşleşmiyor!');
      return;
    }

    setLoading(true);
    const res = await api.resetPassword(forgotEmail, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz.');
      setLoginPassword(newPassword);
      setAuthMode('login');
    } else {
      setErrorMsg(res.error || 'Şifre sıfırlama işlemi başarısız!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #0F172A 0%, #080C14 100%)',
      padding: '24px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '36px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--border-active)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-cyan)',
            margin: '0 auto 12px auto'
          }}>
            <Cpu size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF' }}>
            MES<span style={{ color: 'var(--cyan-primary)' }}>.PLATFORM</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {authMode === 'login' ? 'Üretim Yönetim & İzleme Sistemi' :
             authMode === 'register' ? 'Yeni Personel / Çalışan Kaydı' :
             'Hesap Şifresi Yenileme'}
          </p>
        </div>

        {/* Tab Switcher (Only visible in login & register modes) */}
        {authMode !== 'forgot' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); resetMessages(); }}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: authMode === 'login' ? 'var(--cyan-primary)' : 'transparent',
                color: authMode === 'login' ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); resetMessages(); }}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: authMode === 'register' ? 'var(--cyan-primary)' : 'transparent',
                color: authMode === 'register' ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Yeni Kayıt Ol
            </button>
          </div>
        ) : (
          /* Back to Login Header for Forgot Mode */
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); resetMessages(); }}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <ArrowLeft size={14} />
              <span>Giriş Ekranına Dön</span>
            </button>
          </div>
        )}

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div style={{
            background: 'var(--status-stopped-bg)',
            border: '1px solid var(--status-stopped)',
            color: 'var(--status-stopped)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--status-running-bg)',
            border: '1px solid var(--status-running)',
            color: 'var(--status-running)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Kullanıcı Adı
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
                <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Şifre
                </label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); resetMessages(); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--cyan-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Şifremi Unuttum?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px', marginTop: '6px', width: '100%', fontSize: '0.92rem' }}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Ad Soyad
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="operator_ahmet"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Fabrika Rolü
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="input-field"
                >
                  <option value="OPERATOR">⚡ Operatör (Usta)</option>
                  <option value="PLANNER">📊 Planlama Sorumlusu</option>
                  <option value="QC">🔬 Kalite Kontrolcü</option>
                  <option value="SHIPMENT">📦 Sevkiyat Sorumlusu</option>
                  <option value="ADMIN">👑 Yönetici</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                E-posta Adresi
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ahmet@fabrika.local"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Şifre
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="En az 4 karakter"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px', marginTop: '6px', width: '100%', fontSize: '0.92rem' }}
            >
              {loading ? 'Kayıt Yapılıyor...' : 'Hesabı Oluştur'}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {authMode === 'forgot' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid var(--border-active)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <KeyRound size={22} color="var(--cyan-primary)" />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Kayıtlı e-posta adresinizi girerek yeni şifrenizi doğrudan belirleyebilirsiniz.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Kayıtlı E-posta Adresi
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ornek: admin@mes.local"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Yeni Şifre
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 4 karakter"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Yeni Şifre Tekrarı
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifreyi tekrar yazın"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px', marginTop: '6px', width: '100%', fontSize: '0.92rem' }}
            >
              {loading ? 'Şifre Güncelleniyor...' : 'Şifremi Sıfırla & Güncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
