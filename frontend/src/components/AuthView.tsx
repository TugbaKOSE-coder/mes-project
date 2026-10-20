import React, { useState } from 'react';
import { Cpu, Lock, User as UserIcon, Mail, Shield, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { User, UserRole } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('OPERATOR');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
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
    setErrorMsg(null);
    setSuccessMsg(null);
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
      setIsLoginTab(true);
    } else {
      setErrorMsg(res.error || 'Kayıt işlemi başarısız!');
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            Üretim Yönetim & İzleme Sistemi
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setErrorMsg(null); }}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isLoginTab ? 'var(--cyan-primary)' : 'transparent',
              color: isLoginTab ? '#000' : 'var(--text-secondary)',
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
            onClick={() => { setIsLoginTab(false); setErrorMsg(null); }}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: !isLoginTab ? 'var(--cyan-primary)' : 'transparent',
              color: !isLoginTab ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Yeni Kayıt Ol
          </button>
        </div>

        {/* Messages */}
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

        {/* 1. Login Form */}
        {isLoginTab ? (
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
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Şifre
              </label>
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

            {/* Quick Demo Login Pill */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px' }}>
                Hızlı Test İçin Varsayılan Yönetici:
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('admin123');
                  handleLogin();
                }}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '8px', fontSize: '0.78rem' }}
              >
                👑 Tek Tıkla Admin Olarak Gir (admin / admin123)
              </button>
            </div>
          </form>
        ) : (
          /* 2. Register Form */
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
      </div>
    </div>
  );
};
