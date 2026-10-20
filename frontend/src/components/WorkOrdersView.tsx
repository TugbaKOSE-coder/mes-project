import React, { useState } from 'react';
import {
  Plus,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  X,
  Play
} from 'lucide-react';
import { WorkOrder, Workstation, WorkOrderStatus, Priority } from '../types';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  workstations: Workstation[];
  onCreateWorkOrder: (order: Partial<WorkOrder>) => void;
  onUpdateStatus: (orderId: number, status: WorkOrderStatus) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  workstations,
  onCreateWorkOrder,
  onUpdateStatus
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [orderCode, setOrderCode] = useState(`WO-${new Date().getFullYear()}-${Math.floor(Math.random() * 899 + 100)}`);
  const [productName, setProductName] = useState('Çelik Gövde Plakası');
  const [plannedQuantity, setPlannedQuantity] = useState(100);
  const [selectedStationId, setSelectedStationId] = useState<number | undefined>(workstations[0]?.id);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [notes, setNotes] = useState('');

  const filteredOrders = workOrders.filter(wo => {
    if (filterStatus === 'ALL') return true;
    return wo.status === filterStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateWorkOrder({
      work_order_code: orderCode,
      planned_quantity: Number(plannedQuantity),
      workstation_id: selectedStationId ? Number(selectedStationId) : undefined,
      priority,
      notes,
      product_id: 1
    });
    setIsModalOpen(false);
    setOrderCode(`WO-${new Date().getFullYear()}-${Math.floor(Math.random() * 899 + 100)}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>İş Emirleri & Üretim Planlama</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Sipariş kalemlerinden türetilen iş emirleri, termin tarihleri ve istasyon atamaları
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '10px 18px' }}
        >
          <Plus size={18} />
          <span>Yeni İş Emri Aç</span>
        </button>
      </div>

      {/* Gantt Timeline Mini Preview */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--cyan-primary)" />
            <h3 style={{ fontSize: '1rem' }}>Üretim Planlama & Zaman Çizelgesi (Gantt Görünümü)</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Vardiya Süresi: 08:00 - 17:00 (1 Günlük Dilim)
          </span>
        </div>

        {/* Timeline Header Hours */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px repeat(9, 1fr)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div style={{ textAlign: 'left', fontWeight: 600 }}>İstasyon / Hat</div>
          <div>08:00</div>
          <div>09:00</div>
          <div>10:00</div>
          <div>11:00</div>
          <div>12:00</div>
          <div>13:00</div>
          <div>14:00</div>
          <div>15:00</div>
          <div>16:00</div>
        </div>

        {/* Timeline Rows per Station */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {workstations.map((st) => {
            const assignedOrders = workOrders.filter(wo => wo.workstation_id === st.id);
            return (
              <div
                key={st.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 6px'
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-white)' }}>
                  <span className="font-mono" style={{ color: 'var(--cyan-primary)', marginRight: '6px' }}>[{st.code}]</span>
                  {st.name}
                </div>

                {/* Timeline Bar Space */}
                <div style={{
                  position: 'relative',
                  height: '28px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}>
                  {assignedOrders.map((wo, idx) => {
                    const isRunning = wo.status === 'IN_PROGRESS';
                    const isStopped = wo.status === 'STOPPED';
                    const isQC = wo.status === 'QUALITY_CHECK';
                    const isCompleted = wo.status === 'COMPLETED';

                    return (
                      <div
                        key={wo.id}
                        title={`${wo.work_order_code}: ${wo.product?.name} (${wo.produced_quantity}/${wo.planned_quantity})`}
                        style={{
                          height: '22px',
                          margin: '0 4px',
                          padding: '0 8px',
                          borderRadius: '3px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          background: isRunning ? 'linear-gradient(90deg, #10B981, #059669)' :
                                      isStopped ? 'linear-gradient(90deg, #F43F5E, #E11D48)' :
                                      isQC ? 'linear-gradient(90deg, #A855F7, #7E22CE)' :
                                      isCompleted ? 'linear-gradient(90deg, #059669, #047857)' :
                                      'linear-gradient(90deg, #38BDF8, #0284C7)',
                          color: '#FFF',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                          minWidth: '160px'
                        }}
                      >
                        <span className="font-mono">{wo.work_order_code}</span>
                        <span style={{ opacity: 0.85 }}>({wo.produced_quantity}/{wo.planned_quantity})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs & Orders Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'ALL', label: 'Tüm İş Emirleri' },
              { id: 'IN_PROGRESS', label: 'Üretimde' },
              { id: 'STOPPED', label: 'Duruşta' },
              { id: 'QUALITY_CHECK', label: 'Kalite Kontrolde' },
              { id: 'COMPLETED', label: 'Tamamlandı' },
              { id: 'PENDING', label: 'Beklemede' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: filterStatus === tab.id ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                  background: filterStatus === tab.id ? 'var(--cyan-glow)' : 'rgba(255,255,255,0.02)',
                  color: filterStatus === tab.id ? 'var(--cyan-primary)' : 'var(--text-secondary)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Toplam: <strong>{filteredOrders.length}</strong> kayıt
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px' }}>İŞ EMRİ KODU</th>
                <th style={{ padding: '12px 10px' }}>ÜRÜN</th>
                <th style={{ padding: '12px 10px' }}>İSTASYON</th>
                <th style={{ padding: '12px 10px' }}>ÖNCELİK</th>
                <th style={{ padding: '12px 10px' }}>İLERLEME</th>
                <th style={{ padding: '12px 10px' }}>DURUM</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>DURUM DEĞİŞTİR</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((wo) => {
                const progress = wo.planned_quantity > 0
                  ? Math.round((wo.produced_quantity / wo.planned_quantity) * 100)
                  : 0;

                return (
                  <tr
                    key={wo.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 10px', fontWeight: 700 }} className="font-mono">
                      {wo.work_order_code}
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                        {wo.product?.name || 'Ürün'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Birim: {wo.product?.unit || 'ADET'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      {wo.workstation ? (
                        <span style={{ color: 'var(--text-primary)' }}>
                          [{wo.workstation.code}] {wo.workstation.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Atanmadı</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: wo.priority === 'URGENT' ? 'var(--status-stopped)' :
                               wo.priority === 'HIGH' ? 'var(--status-warning)' : 'var(--text-secondary)'
                      }}>
                        {wo.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', minWidth: '150px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span>{wo.produced_quantity} / {wo.planned_quantity}</span>
                        <span style={{ fontWeight: 700 }}>%{progress}</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: 'var(--cyan-primary)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span className={`badge badge-${wo.status.toLowerCase().replace('_', '')}`}>
                        {wo.status === 'IN_PROGRESS' ? 'Üretimde' :
                         wo.status === 'STOPPED' ? 'Duruşta' :
                         wo.status === 'QUALITY_CHECK' ? 'Kalite Kontrolde' :
                         wo.status === 'COMPLETED' ? 'Tamamlandı' :
                         wo.status === 'PLANNED' ? 'Planlandı' : 'Beklemede'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {wo.status === 'PLANNED' && (
                          <button
                            onClick={() => onUpdateStatus(wo.id, 'IN_PROGRESS')}
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <Play size={12} /> Başlat
                          </button>
                        )}
                        {wo.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => onUpdateStatus(wo.id, 'QUALITY_CHECK')}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--status-qc)' }}
                          >
                            Kaliteye Sevk
                          </button>
                        )}
                        {wo.status === 'QUALITY_CHECK' && (
                          <button
                            onClick={() => onUpdateStatus(wo.id, 'COMPLETED')}
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <CheckCircle2 size={12} /> Tamamla
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Work Order */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '500px',
            background: 'var(--bg-modal)',
            padding: '24px',
            border: '1px solid var(--border-active)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Yeni İş Emri Oluştur</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  İş Emri Kodu
                </label>
                <input
                  type="text"
                  required
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Üretilecek Ürün
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Planlanan Adet
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={plannedQuantity}
                    onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Öncelik
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="input-field"
                  >
                    <option value="LOW">Düşük</option>
                    <option value="MEDIUM">Normal</option>
                    <option value="HIGH">Yüksek</option>
                    <option value="URGENT">Acil</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Atanacak İstasyon / Makine
                </label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(Number(e.target.value))}
                  className="input-field"
                >
                  {workstations.map(st => (
                    <option key={st.id} value={st.id}>
                      [{st.code}] {st.name} ({st.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Özel Notlar / Talimatlar
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Operatör için teknik toleranslar, kalıp bilgisi vb."
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  İş Emrini Başlat & Planla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
