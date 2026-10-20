import React from 'react';
import { Shield, Clock, RefreshCw, Cpu, LogOut, User as UserIcon } from 'lucide-react';
import { UserRole, User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  activeStationsCount: number;
  stoppedStationsCount: number;
  onSimulateTick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  activeStationsCount,
  stoppedStationsCount,
  onSimulateTick
}) => {
  const [time, setTime] = React.useState<string>(new Date().toLocaleTimeString('tr-TR'));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('tr-TR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      height: '68px',
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'var(--glass-blur)'
    }}>
      {/* Brand & Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-cyan)'
          }}>
            <Cpu size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF' }}>
                MES<span style={{ color: 'var(--cyan-primary)' }}>.CORE</span>
              </span>
              <span className="badge badge-planned" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                v1.0.0
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Üretim Yönetim & İzleme Sistemi
            </div>
          </div>
        </div>

        {/* Live Factory Telemetry Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-dot running" />
            <span style={{ color: 'var(--status-running)', fontWeight: 600 }}>{activeStationsCount} Çalışıyor</span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-dot stopped" />
            <span style={{ color: stoppedStationsCount > 0 ? 'var(--status-stopped)' : 'var(--text-secondary)', fontWeight: 600 }}>
              {stoppedStationsCount} Duruşta
            </span>
          </div>
        </div>
      </div>

      {/* Center Shift & Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="var(--cyan-primary)" />
          <span className="font-mono" style={{ color: 'var(--text-white)', fontWeight: 600 }}>{time}</span>
        </div>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>
          1. Vardiya (08:00 - 16:00)
        </span>
      </div>

      {/* Right Controls: User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* User Card */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.04)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--cyan-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-primary)'
            }}>
              <UserIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-white)', lineHeight: 1.2 }}>
                {currentUser.full_name || currentUser.username}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--cyan-primary)', fontWeight: 600 }}>
                {currentUser.role === 'ADMIN' ? '👑 Yönetici' :
                 currentUser.role === 'OPERATOR' ? '⚡ Operatör' :
                 currentUser.role === 'PLANNER' ? '📊 Planlama' :
                 currentUser.role === 'QC' ? '🔬 Kalite' : '📦 Sevkiyat'}
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn btn-secondary"
          title="Oturumu Kapat"
          style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--status-stopped)' }}
        >
          <LogOut size={15} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </header>
  );
};
