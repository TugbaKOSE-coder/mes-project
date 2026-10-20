import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Flame,
  CheckCircle2,
  BarChart3,
  Truck,
  Settings,
  HelpCircle
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: UserRole;
  qcPendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  qcPendingCount
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Fabrika Genel Bakış',
      icon: LayoutDashboard,
      badge: null,
      roles: ['ADMIN', 'PLANNER', 'OPERATOR', 'QC', 'SHIPMENT']
    },
    {
      id: 'work-orders',
      label: 'İş Emirleri & Gantt',
      icon: ClipboardList,
      badge: null,
      roles: ['ADMIN', 'PLANNER', 'SHIPMENT']
    },
    {
      id: 'operator',
      label: 'Operatör Terminali',
      icon: Flame,
      badge: 'Canlı',
      badgeColor: 'var(--status-running)',
      roles: ['ADMIN', 'OPERATOR', 'PLANNER']
    },
    {
      id: 'quality',
      label: 'Kalite Kontrol Masası',
      icon: CheckCircle2,
      badge: qcPendingCount > 0 ? `${qcPendingCount}` : null,
      badgeColor: 'var(--status-qc)',
      roles: ['ADMIN', 'QC', 'PLANNER']
    },
    {
      id: 'analytics',
      label: 'OEE & Verim Analitiği',
      icon: BarChart3,
      badge: null,
      roles: ['ADMIN', 'PLANNER']
    }
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 14px',
      flexShrink: 0
    }}>
      <div>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          padding: '0 10px 12px 10px'
        }}>
          Üretim Modülleri
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAuthorized = item.roles.includes(currentRole);

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  color: isActive ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.18s ease',
                  opacity: isAuthorized ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? 'var(--cyan-primary)' : 'var(--text-secondary)'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: item.badgeColor ? `${item.badgeColor}22` : 'rgba(255,255,255,0.1)',
                    color: item.badgeColor || 'var(--text-white)',
                    border: `1px solid ${item.badgeColor || 'rgba(255,255,255,0.2)'}`
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        fontSize: '0.76rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
          🎓 Bitirme Projesi MES
        </div>
        <div>Bilgisayar Mühendisliği</div>
        <div style={{ marginTop: '6px', color: 'var(--cyan-primary)', fontSize: '0.72rem' }}>
          • FastAPI & React Entegre
        </div>
      </div>
    </aside>
  );
};
