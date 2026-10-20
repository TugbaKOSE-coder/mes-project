import React, { useState } from 'react';
import {
  Flame,
  Play,
  Pause,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Workstation, WorkOrder, DowntimeReason } from '../types';

interface OperatorViewProps {
  workstations: Workstation[];
  workOrders: WorkOrder[];
  downtimeReasons: DowntimeReason[];
  initialStationId?: number;
  onLogProduction: (log: {
    work_order_id: number;
    workstation_id: number;
    produced_quantity: number;
    scrap_quantity: number;
    downtime_minutes: number;
    downtime_reason_id?: number;
    notes?: string;
  }) => void;
  onUpdateOrderStatus: (orderId: number, status: any, notes?: string) => void;
  onUpdateStationStatus: (stationId: number, status: any) => void;
}

export const OperatorView: React.FC<OperatorViewProps> = ({
  workstations,
  workOrders,
  downtimeReasons,
  initialStationId,
  onLogProduction,
  onUpdateOrderStatus,
  onUpdateStationStatus
}) => {
  const [selectedStationId, setSelectedStationId] = useState<number>(
    initialStationId || workstations[0]?.id || 1
  );

  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);
  const [selectedDowntimeReasonId, setSelectedDowntimeReasonId] = useState<number>(downtimeReasons[0]?.id || 1);
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(15);
  const [downtimeNotes, setDowntimeNotes] = useState<string>('');

  const activeStation = workstations.find(w => w.id === selectedStationId);

  // Active work order assigned to this machine
  const activeOrder = workOrders.find(
    wo => wo.workstation_id === selectedStationId && ['IN_PROGRESS', 'STOPPED', 'PLANNED'].includes(wo.status)
  );

  const isRunning = activeStation?.status === 'RUNNING';
  const isStopped = activeStation?.status === 'STOPPED';

  const handleAddQuantity = (qty: number) => {
    if (!activeOrder) return;
    onLogProduction({
      work_order_id: activeOrder.id,
      workstation_id: selectedStationId,
      produced_quantity: qty,
      scrap_quantity: 0,
      downtime_minutes: 0
    });
  };

  const handleAddScrap = () => {
    if (!activeOrder) return;
    onLogProduction({
      work_order_id: activeOrder.id,
      workstation_id: selectedStationId,
      produced_quantity: 0,
      scrap_quantity: 1,
      downtime_minutes: 0,
      notes: 'Hatalı parça operatör tarafından ayrıldı'
    });
  };

  const handleStartProduction = () => {
    if (!activeOrder) return;
    onUpdateStationStatus(selectedStationId, 'RUNNING');
    onUpdateOrderStatus(activeOrder.id, 'IN_PROGRESS');
  };

  const handleConfirmDowntime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    onUpdateStationStatus(selectedStationId, 'STOPPED');
    onUpdateOrderStatus(activeOrder.id, 'STOPPED', `Duruş: ${downtimeMinutes} dk - ${downtimeNotes}`);
    onLogProduction({
      work_order_id: activeOrder.id,
      workstation_id: selectedStationId,
      produced_quantity: 0,
      scrap_quantity: 0,
      downtime_minutes: Number(downtimeMinutes),
      downtime_reason_id: Number(selectedDowntimeReasonId),
      notes: downtimeNotes
    });

    setIsDowntimeModalOpen(false);
    setDowntimeNotes('');
  };

  const handleSendToQC = () => {
    if (!activeOrder) return;
    onUpdateStationStatus(selectedStationId, 'IDLE');
    onUpdateOrderStatus(activeOrder.id, 'QUALITY_CHECK', 'Hedef miktar tamamlandı, kalite onayına gönderildi.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(2, 132, 199, 0.05))',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--cyan-primary)',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            color: '#000'
          }}>
            <Flame size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Operatör Saha Terminali (Shopfloor Touch Mode)</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Tezgah başı parça sayımı, anlık arıza bildirimi ve iş akışı kontrol paneli
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Masaüstü / Dokunmatik Tablet Arayüzü</span>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${workstations.length}, 1fr)`,
        gap: '12px'
      }}>
        {workstations.map(st => {
          const isSelected = st.id === selectedStationId;
          const isStRunning = st.status === 'RUNNING';
          const isStStopped = st.status === 'STOPPED';

          return (
            <button
              key={st.id}
              onClick={() => setSelectedStationId(st.id)}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)',
                border: isSelected ? '2px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                color: 'var(--text-white)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: isSelected ? 'var(--shadow-cyan)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                  [{st.code}]
                </span>
                <span className={`badge badge-${st.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                  {st.status === 'RUNNING' ? 'Çalışıyor' : st.status === 'STOPPED' ? 'Duruşta' : 'Boşta'}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{st.name}</div>
            </button>
          );
        })}
      </div>

      {/* Main Operator Workstation Control Station */}
      {activeStation && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px'
        }}>
          {/* Left Column: Big Telemetry & Counters */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Station State Alert */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: isRunning ? 'var(--status-running-bg)' : isStopped ? 'var(--status-stopped-bg)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isRunning ? 'rgba(16, 185, 129, 0.3)' : isStopped ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'}`,
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`status-dot ${activeStation.status.toLowerCase()}`} style={{ width: '12px', height: '12px' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {activeStation.name} • {isRunning ? 'İŞLENİYOR' : isStopped ? 'ARIZA / DURUŞTA' : 'BEKLEMEDE'}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      Standart Kapasite: {activeStation.capacity_per_hour} Parça / Saat
                    </div>
                  </div>
                </div>

                {activeOrder && (
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cyan-primary)' }}>
                    {activeOrder.work_order_code}
                  </span>
                )}
              </div>

              {/* Work Order Info */}
              {activeOrder ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Üretilen Ürün:</div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>
                    {activeOrder.product?.name || 'Üretim Parçası'}
                  </h3>

                  {/* Gigantic Production Counter */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    margin: '20px 0'
                  }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ÜRETİLEN SAĞLAM ADET
                      </div>
                      <div style={{ fontSize: '3.4rem', fontWeight: 900, color: 'var(--status-running)', lineHeight: 1.1, marginTop: '6px' }}>
                        {activeOrder.produced_quantity}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Hedef: {activeOrder.planned_quantity} Adet
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        AYRILAN FİRE / ISKARTA
                      </div>
                      <div style={{ fontSize: '3.4rem', fontWeight: 900, color: 'var(--status-stopped)', lineHeight: 1.1, marginTop: '6px' }}>
                        {activeOrder.scrapped_quantity}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Hatalı Parça
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((activeOrder.produced_quantity / activeOrder.planned_quantity) * 100))}%`,
                      background: isStopped ? 'var(--status-stopped)' : 'var(--status-running)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Bu makineye şu an atanmış aktif bir iş emri bulunmuyor.
                </div>
              )}
            </div>

            {/* Quick Touch Increment Buttons */}
            {activeOrder && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                  HIZLI PARÇA SAYACI (DOKUNMATİK EKRAN):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <button
                    onClick={() => handleAddQuantity(1)}
                    className="btn btn-primary"
                    style={{ padding: '16px', fontSize: '1.2rem', fontWeight: 800 }}
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleAddQuantity(5)}
                    className="btn btn-primary"
                    style={{ padding: '16px', fontSize: '1.2rem', fontWeight: 800 }}
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAddQuantity(10)}
                    className="btn btn-primary"
                    style={{ padding: '16px', fontSize: '1.2rem', fontWeight: 800 }}
                  >
                    +10
                  </button>
                  <button
                    onClick={handleAddScrap}
                    className="btn btn-danger"
                    title="Hatalı parça kaydet"
                    style={{ padding: '16px', fontSize: '0.9rem', fontWeight: 800 }}
                  >
                    +1 Fire
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Process Control & State Machine Actions */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Üretim & Tezgah Aksiyonları</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Start / Resume Button */}
                <button
                  onClick={handleStartProduction}
                  disabled={isRunning || !activeOrder}
                  className="btn btn-success"
                  style={{
                    padding: '16px',
                    fontSize: '1rem',
                    opacity: isRunning || !activeOrder ? 0.5 : 1,
                    cursor: isRunning || !activeOrder ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={20} />
                  <span>{isStopped ? 'Duruşu Bitir & Üretime Devam Et' : 'İşe Başla (Çalışıyor)'}</span>
                </button>

                {/* 2. Stop / Downtime Button */}
                <button
                  onClick={() => setIsDowntimeModalOpen(true)}
                  disabled={!isRunning || !activeOrder}
                  className="btn btn-danger"
                  style={{
                    padding: '16px',
                    fontSize: '1rem',
                    opacity: !isRunning || !activeOrder ? 0.5 : 1,
                    cursor: !isRunning || !activeOrder ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Pause size={20} />
                  <span>Arıza / Duruş Bildir</span>
                </button>

                {/* 3. Send to QC Button */}
                <button
                  onClick={handleSendToQC}
                  disabled={!activeOrder}
                  className="btn btn-primary"
                  style={{
                    padding: '16px',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #A855F7, #7E22CE)',
                    opacity: !activeOrder ? 0.5 : 1
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>Üretimi Tamamla & Kalite Kontrole Gönder</span>
                </button>
              </div>

              {/* Shift Notes Info */}
              {activeOrder?.notes && (
                <div style={{
                  marginTop: '20px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--status-warning)', marginBottom: '4px' }}>
                    ⚠️ Mühendislik / Planlama Notu:
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {activeOrder.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Operator Safety & Audit Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px'
            }}>
              <ShieldAlert size={16} color="var(--cyan-primary)" />
              <span>Tüm durum geçişleri ve parça logları sisteme operatör ID ile kaydedilir.</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Downtime / Arıza Bildirimi */}
      {isDowntimeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '480px',
            background: 'var(--bg-modal)',
            padding: '24px',
            border: '1px solid var(--status-stopped)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--status-stopped)',
                padding: '10px',
                borderRadius: 'var(--radius-md)'
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>Duruş & Arıza Bildir</h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Makinanın duruş gerekçesini ve tahmini süreyi giriniz
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmDowntime} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Duruş Nedeni / Kategori
                </label>
                <select
                  value={selectedDowntimeReasonId}
                  onChange={(e) => setSelectedDowntimeReasonId(Number(e.target.value))}
                  className="input-field"
                >
                  {downtimeReasons.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.code}] {r.name} ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Duruş Süresi (Dakika)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={downtimeMinutes}
                  onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Açıklama / Arıza Detayı
                </label>
                <textarea
                  rows={3}
                  value={downtimeNotes}
                  onChange={(e) => setDowntimeNotes(e.target.value)}
                  placeholder="Örn: Kesici elmas uç kırıldı, bakım ekibi çağrıldı."
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsDowntimeModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  style={{ flex: 2 }}
                >
                  Duruşu Onayla & Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
