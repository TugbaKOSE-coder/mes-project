import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { WorkOrder, QCDecision } from '../types';

interface QualityViewProps {
  workOrders: WorkOrder[];
  onSubmitInspection: (data: {
    work_order_id: number;
    sample_quantity: number;
    accepted_quantity: number;
    rejected_quantity: number;
    decision: QCDecision;
    defect_reason?: string;
  }) => void;
}

export const QualityView: React.FC<QualityViewProps> = ({
  workOrders,
  onSubmitInspection
}) => {
  const pendingQC = workOrders.filter(wo => wo.status === 'QUALITY_CHECK');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    pendingQC[0]?.id || null
  );

  const selectedOrder = workOrders.find(wo => wo.id === selectedOrderId) || pendingQC[0];

  const [sampleQty, setSampleQty] = useState<number>(20);
  const [acceptedQty, setAcceptedQty] = useState<number>(19);
  const [rejectedQty, setRejectedQty] = useState<number>(1);
  const [defectReason, setDefectReason] = useState<string>('Yüzey çapağı ve mikrometre tolerans sapması');

  const handleDecision = (decision: QCDecision) => {
    if (!selectedOrder) return;
    onSubmitInspection({
      work_order_id: selectedOrder.id,
      sample_quantity: Number(sampleQty),
      accepted_quantity: decision === 'APPROVED' ? Number(sampleQty) : Number(acceptedQty),
      rejected_quantity: decision === 'APPROVED' ? 0 : Number(rejectedQty),
      decision,
      defect_reason: decision === 'REJECTED' ? defectReason : undefined
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Kalite Kontrol (QC) & Muayene İstasyonu</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Üretimi tamamlanan partilerin kalite muayenesi, kabul/ret kararları ve yeniden işleme (rework) akışı
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
        {/* Left: Pending Quality Check Orders */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem' }}>Onay Bekleyen Partiler ({pendingQC.length})</h3>
            <span className="badge badge-qc">Kalite Muayenesi</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingQC.length > 0 ? (
              pendingQC.map(wo => {
                const isSelected = selectedOrder?.id === wo.id;
                return (
                  <button
                    key={wo.id}
                    onClick={() => setSelectedOrderId(wo.id)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '2px solid var(--status-qc)' : '1px solid var(--border-subtle)',
                      color: 'var(--text-white)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--status-qc)' }}>
                        {wo.work_order_code}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Üretilen: {wo.produced_quantity} Adet
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{wo.product?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      İstasyon: [{wo.workstation?.code}] {wo.workstation?.name}
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 10px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={36} color="var(--status-running)" style={{ margin: '0 auto 10px auto' }} />
                Şu an kalite onayı bekleyen hiçbir iş emri yok. Tüm partiler tamamlandı!
              </div>
            )}
          </div>
        </div>

        {/* Right: Inspection Form & Decision */}
        {selectedOrder ? (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-qc" style={{ marginBottom: '6px' }}>
                    Parti Muayenesi
                  </span>
                  <h2 style={{ fontSize: '1.3rem' }}>{selectedOrder.work_order_code}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Ürün: <strong>{selectedOrder.product?.name}</strong> • Toplam Parti Adedi: <strong>{selectedOrder.produced_quantity}</strong>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'right',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ color: 'var(--text-muted)' }}>Hat / Tezgah:</div>
                  <div style={{ fontWeight: 600, color: 'var(--cyan-primary)' }}>
                    [{selectedOrder.workstation?.code}] {selectedOrder.workstation?.name}
                  </div>
                </div>
              </div>

              {/* Inspection Sampling Inputs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: 'rgba(0,0,0,0.25)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Alınan Numune
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sampleQty}
                    onChange={(e) => setSampleQty(Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Kabul Edilen
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(Number(e.target.value))}
                    className="input-field"
                    style={{ borderColor: 'var(--status-running)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Hatalı / Ret
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(Number(e.target.value))}
                    className="input-field"
                    style={{ borderColor: 'var(--status-stopped)' }}
                  />
                </div>
              </div>

              {/* Defect Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Ret / Kusur Gerekçesi (Ret verilirse operatöre iletilir):
                </label>
                <textarea
                  rows={3}
                  value={defectReason}
                  onChange={(e) => setDefectReason(e.target.value)}
                  placeholder="Kusur detayı giriniz (Çapak, çatlak, ölçü sapması vb.)"
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Decision Buttons (APPROVED vs REJECTED Rework) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              {/* Rework / Reject Button */}
              <button
                onClick={() => handleDecision('REJECTED')}
                className="btn btn-danger"
                style={{ padding: '14px', fontSize: '0.92rem' }}
              >
                <XCircle size={18} />
                <span>REDDET & YENİDEN İŞLE (REWORK)</span>
              </button>

              {/* Approve Button */}
              <button
                onClick={() => handleDecision('APPROVED')}
                className="btn btn-success"
                style={{ padding: '14px', fontSize: '0.92rem' }}
              >
                <CheckCircle2 size={18} />
                <span>ONAYLA & SEVKİYATA GÖNDER</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
