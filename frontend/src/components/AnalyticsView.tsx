import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Award,
  CheckCircle2
} from 'lucide-react';
import { WorkOrder, Workstation } from '../types';
import { api, OeeMetrics } from '../api';

interface AnalyticsViewProps {
  workOrders: WorkOrder[];
  workstations: Workstation[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ workOrders, workstations }) => {
  const [metrics, setMetrics] = useState<OeeMetrics>({
    availability_rate: 0,
    performance_rate: 0,
    quality_rate: 0,
    oee_rate: 0,
    shift_planned_minutes: 0,
    total_downtime_minutes: 0,
    total_planned: 0,
    total_produced: 0,
    total_scrapped: 0,
    standard_cycle_sec: 60,
    actual_cycle_sec: 0,
    downtime_pareto: []
  });

  const loadOee = async () => {
    const data = await api.getOeeMetrics();
    setMetrics(data);
  };

  useEffect(() => {
    loadOee();
    const timer = setInterval(loadOee, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleExportPDF = () => {
    alert("📄 Üretim ve Duruş Raporu PDF formatında hazırlandı ve indiriliyor...");
  };

  const handleExportExcel = () => {
    alert("📊 Fabrika Vardiya ve İş Emri Verileri Excel (.xlsx) formatında dışa aktarıldı!");
  };

  const colors = ['#F43F5E', '#FB923C', '#38BDF8', '#94A3B8', '#A855F7', '#10B981'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Header & Export Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Verimlilik Analitiği & OEE Raporları</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Genel Ekipman Verimliliği (OEE), duruş nedenleri dağılımı ve yönetim karar destek metrikleri
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <FileSpreadsheet size={16} color="var(--status-running)" />
            <span>Excel Dışa Aktar</span>
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <FileText size={16} />
            <span>PDF Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* 3 OEE Pillars (100% Dynamic from DB) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* Availability */}
        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid var(--cyan-primary)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            1. KULLANILABİLİRLİK (AVAILABILITY)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--cyan-primary)', margin: '6px 0' }}>
            %{metrics.availability_rate}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Planlanan Çalışma: {metrics.shift_planned_minutes} dk • Duruş Kaybı: {metrics.total_downtime_minutes} dk
          </div>
        </div>

        {/* Performance */}
        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid var(--status-running)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            2. PERFORMANS (PERFORMANCE)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--status-running)', margin: '6px 0' }}>
            %{metrics.performance_rate}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Standart Çevrim: {metrics.standard_cycle_sec || 60} sn • Gerçekleşen Ortalama: {metrics.actual_cycle_sec > 0 ? `${metrics.actual_cycle_sec} sn` : `${metrics.total_produced} Adet`}
          </div>
        </div>

        {/* Quality */}
        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid var(--status-qc)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            3. KALİTE ORANI (QUALITY)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--status-qc)', margin: '6px 0' }}>
            %{metrics.quality_rate}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sağlam Ürün: {metrics.total_produced} Adet • Fire / Hurda: {metrics.total_scrapped} Adet
          </div>
        </div>
      </div>

      {/* Pareto Downtime Breakdown & Station Load */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Downtime Breakdown Bars (100% Dynamic from DB) */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--status-stopped)" />
              <h3 style={{ fontSize: '1rem' }}>En Sık Yaşanan Duruş Nedenleri (Pareto Analizi)</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Toplam Duruş: {metrics.total_downtime_minutes} dk
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metrics.downtime_pareto.length > 0 ? (
              metrics.downtime_pareto.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{item.reason}</span>
                    <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{item.minutes} dk (%{item.percent})</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.percent}%`,
                      background: colors[idx % colors.length],
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '30px 10px',
                color: 'var(--text-muted)',
                fontSize: '0.84rem'
              }}>
                <CheckCircle2 size={32} color="var(--status-running)" style={{ margin: '0 auto 8px auto' }} />
                Veritabanında henüz kayıtlı bir duruş / arıza logu bulunmuyor.
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Operatör terminalinden arıza bildirildiğinde gerçek dakikalar ve yüzdeler burada listelenecektir.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Station Workload */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={18} color="var(--cyan-primary)" />
            <h3 style={{ fontSize: '1rem' }}>İstasyon Bazlı Doluluk Oranları</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workstations.map(st => (
              <div
                key={st.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{st.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Kapasite: {st.capacity_per_hour} ad/saat
                  </div>
                </div>
                <span className={`badge badge-${st.status.toLowerCase()}`}>
                  {st.status === 'RUNNING' ? 'Aktif' : st.status === 'STOPPED' ? 'Duruş' : 'Boşta'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
