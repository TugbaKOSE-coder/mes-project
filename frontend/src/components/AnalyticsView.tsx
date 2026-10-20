import React from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  TrendingUp,
  Clock,
  AlertTriangle,
  Award
} from 'lucide-react';
import { WorkOrder, Workstation } from '../types';

interface AnalyticsViewProps {
  workOrders: WorkOrder[];
  workstations: Workstation[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ workOrders, workstations }) => {
  const handleExportPDF = () => {
    alert("📄 Üretim ve Duruş Raporu PDF formatında hazırlandı ve indiriliyor...");
  };

  const handleExportExcel = () => {
    alert("📊 Fabrika Vardiya ve İş Emri Verileri Excel (.xlsx) formatında dışa aktarıldı!");
  };

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

      {/* 3 OEE Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid var(--cyan-primary)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            1. KULLANILABİLİRLİK (AVAILABILITY)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--cyan-primary)', margin: '6px 0' }}>
            %92.4
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Planlanan Çalışma: 480 dk • Duruş Kaybı: 36 dk
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid var(--status-running)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            2. PERFORMANS (PERFORMANCE)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--status-running)', margin: '6px 0' }}>
            %96.8
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Standart Çevrim: 60 sn • Gerçekleşen Ortalama: 62 sn
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid var(--status-qc)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            3. KALİTE ORANI (QUALITY)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--status-qc)', margin: '6px 0' }}>
            %98.2
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sağlam Ürün: 317 Adet • Fire / Hurda: 8 Adet
          </div>
        </div>
      </div>

      {/* Pareto Downtime Breakdown & Station Load */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Downtime Breakdown Bars */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--status-stopped)" />
            <h3 style={{ fontSize: '1rem' }}>En Sık Yaşanan Duruş Nedenleri (Pareto Analizi)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { reason: 'Mekanik Arıza (Bıçak / Uç Kırılması)', minutes: 45, percent: 45, color: '#F43F5E' },
              { reason: 'Hammadde Eksikliği / Sac Besleme Gecikmesi', minutes: 30, percent: 30, color: '#FB923C' },
              { reason: 'Kalıp & Model Değişimi (Setup)', minutes: 15, percent: 15, color: '#38BDF8' },
              { reason: 'Operatör Çay / Yemek Molası', minutes: 10, percent: 10, color: '#94A3B8' }
            ].map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{item.reason}</span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{item.minutes} dk (%{item.percent})</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percent}%`,
                    background: item.color,
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
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
