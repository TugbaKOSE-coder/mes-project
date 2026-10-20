import React from 'react';
import { Activity, Shield, Clock, RefreshCw, Cpu, UserCheck } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeStationsCount: number;
  stoppedStationsCount: number;
  onSimulateTick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
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

      {/* Right Controls: Role Switcher & Live Sim */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Simulation Pulse Button */}
        <button
          onClick={onSimulateTick}
          className="btn btn-secondary"
          title="Üretim döngüsünü canlı simüle et"
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
        >
          <RefreshCw size={15} color="var(--cyan-primary)" />
          <span>Simüle Et</span>
        </button>

        {/* Role Switcher Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 6px 4px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={15} color="var(--cyan-primary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rol:</span>
          </div>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            style={{
              background: '#0B111D',
              color: 'var(--text-white)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ADMIN">👑 Yönetici (Admin)</option>
            <option value="PLANNER">📊 Planlama Sorumlusu</option>
            <option value="OPERATOR">⚡ Tezgah Operatörü</option>
            <option value="QC">🔬 Kalite Kontrolcü</option>
            <option value="SHIPMENT">📦 Sevkiyat Sorumlusu</option>
          </select>
        </div>
      </div>
    </header>
  );
};
