import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Cpu,
  Play,
  Pause,
  ArrowRight,
  Flame,
  Percent
} from 'lucide-react';
import { Workstation, WorkOrder, WorkstationStatus } from '../types';

interface DashboardViewProps {
  workstations: Workstation[];
  workOrders: WorkOrder[];
  onOpenOperatorForStation: (stationId: number) => void;
  onUpdateStationStatus: (stationId: number, status: WorkstationStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workstations,
  workOrders,
  onOpenOperatorForStation,
  onUpdateStationStatus
}) => {
  // KPI Calculations
  const totalPlanned = workOrders.reduce((acc, wo) => acc + wo.planned_quantity, 0);
  const totalProduced = workOrders.reduce((acc, wo) => acc + wo.produced_quantity, 0);
  const totalScrapped = workOrders.reduce((acc, wo) => acc + wo.scrapped_quantity, 0);
  const overallProgress = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0;
  const scrapRate = totalProduced > 0 ? ((totalScrapped / (totalProduced + totalScrapped)) * 100).toFixed(1) : '0.0';

  const runningCount = workstations.filter(w => w.status === 'RUNNING').length;
  const stoppedCount = workstations.filter(w => w.status === 'STOPPED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Fabrika Genel Bakış & Canlı Hat Panosu</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Makinelerin anlık çalışma telemetrisi, iş emri ilerlemeleri ve üretim KPI göstergeleri
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-running">
            <span className="status-dot running" /> {runningCount} Hat Üretimde
          </span>
          {stoppedCount > 0 && (
            <span className="badge badge-stopped">
              <span className="status-dot stopped" /> {stoppedCount} Arıza / Duruş
            </span>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Üretim İlerlemesi */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                GENEL ÜRETİM İLERLEMESİ
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
                %{overallProgress}
              </div>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.1)',
              color: 'var(--cyan-primary)'
            }}>
              <TrendingUp size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${overallProgress}%`,
                background: 'linear-gradient(90deg, #06B6D4, #10B981)',
                borderRadius: '3px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>
              <span>{totalProduced} adet üretildi</span>
              <span>Hedef: {totalPlanned}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: OEE */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                OEE (EKİPMAN VERİMLİLİĞİ)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-running)', marginTop: '4px' }}>
                %88.4
              </div>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--status-running)'
            }}>
              <Percent size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', marginTop: '14px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--status-running)' }}>✓ Kullanılabilirlik: %91</span>
            <span>•</span>
            <span>Performans: %97</span>
          </div>
        </div>

        {/* KPI 3: Fire / Hurda */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                TOPLAM FİRE & HURDA
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-warning)', marginTop: '4px' }}>
                %{scrapRate}
              </div>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--status-warning)'
            }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '14px' }}>
            Toplam {totalScrapped} adet hatalı parça ayrıldı
          </div>
        </div>

        {/* KPI 4: Aktif Hat Durumu */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                FABRİKA HAT KAPASİTESİ
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
                {workstations.length} İstasyon
              </div>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--status-planned)'
            }}>
              <Cpu size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '14px' }}>
            {runningCount} aktif çalışıyor, {workstations.length - runningCount} beklemede/duruşta
          </div>
        </div>
      </div>

      {/* Live Workstations Interactive Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.15rem' }}>İstasyonlar & Canlı Makine Telemetrisi</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Her kart atölyedeki bir tezgaha karşılık gelir
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {workstations.map((station) => {
            // Find active work order on this station
            const activeWO = workOrders.find(
              wo => wo.workstation_id === station.id && ['IN_PROGRESS', 'STOPPED'].includes(wo.status)
            ) || workOrders.find(wo => wo.workstation_id === station.id);

            const isRunning = station.status === 'RUNNING';
            const isStopped = station.status === 'STOPPED';

            const progress = activeWO && activeWO.planned_quantity > 0
              ? Math.round((activeWO.produced_quantity / activeWO.planned_quantity) * 100)
              : 0;

            return (
              <div
                key={station.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: isRunning
                    ? '4px solid var(--status-running)'
                    : isStopped
                    ? '4px solid var(--status-stopped)'
                    : '4px solid var(--status-idle)'
                }}
              >
                <div>
                  {/* Station Code & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                      [{station.code}]
                    </span>
                    <span className={`badge badge-${station.status.toLowerCase()}`}>
                      <span className={`status-dot ${station.status.toLowerCase()}`} />
                      {station.status === 'RUNNING' ? 'Çalışıyor' :
                       station.status === 'STOPPED' ? 'Duruşta' :
                       station.status === 'MAINTENANCE' ? 'Bakımda' : 'Boşta'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{station.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Tip: {station.station_type || 'Genel'} • Kapasite: {station.capacity_per_hour} ad/saat
                  </div>

                  {/* Active Work Order Telemetry */}
                  {activeWO ? (
                    <div style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Aktif İş Emri:</span>
                        <span className="font-mono" style={{ color: 'var(--text-white)', fontWeight: 600 }}>
                          {activeWO.work_order_code}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '8px' }}>
                        {activeWO.product?.name || 'Ürün Tanımlı Değil'}
                      </div>

                      {/* Progress */}
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: isStopped ? 'var(--status-stopped)' : 'var(--status-running)',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                        <span>Üretilen: <strong>{activeWO.produced_quantity}</strong> / {activeWO.planned_quantity}</span>
                        <span>Fire: <strong style={{ color: 'var(--status-warning)' }}>{activeWO.scrapped_quantity}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      marginBottom: '16px'
                    }}>
                      İstasyona atanmış aktif bir iş emri yok.
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    onClick={() => onOpenOperatorForStation(station.id)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.78rem' }}
                  >
                    <Flame size={14} />
                    <span>Operatör Terminali</span>
                  </button>

                  {/* Quick Toggle Status */}
                  {isRunning ? (
                    <button
                      onClick={() => onUpdateStationStatus(station.id, 'STOPPED')}
                      className="btn btn-danger"
                      title="Makinayı Duruşa / Arızaya Al"
                      style={{ padding: '8px 12px' }}
                    >
                      <Pause size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStationStatus(station.id, 'RUNNING')}
                      className="btn btn-success"
                      title="Makinayı Çalıştır"
                      style={{ padding: '8px 12px' }}
                    >
                      <Play size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
