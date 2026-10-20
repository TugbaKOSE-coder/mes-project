import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { OperatorView } from './components/OperatorView';
import { QualityView } from './components/QualityView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthView } from './components/AuthView';

import {
  User,
  Workstation,
  WorkOrder,
  DowntimeReason,
  WorkstationStatus,
  WorkOrderStatus,
  QCDecision
} from './types';
import { api, getStoredUser } from './api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [downtimeReasons, setDowntimeReasons] = useState<DowntimeReason[]>([]);
  const [targetOperatorStationId, setTargetOperatorStationId] = useState<number | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Dinamik Veri Yükleme (Tamamen FastAPI Backend ve DB'den)
  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [stations, orders, reasons] = await Promise.all([
        api.getWorkstations(),
        api.getWorkOrders(),
        api.getDowntimeReasons()
      ]);
      setWorkstations(stations || []);
      setWorkOrders(orders || []);
      setDowntimeReasons(reasons || []);
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  // Check login on startup
  useEffect(() => {
    const checkAuth = async () => {
      const user = await api.getMe();
      if (user) {
        setCurrentUser(user);
        if (user.role === 'OPERATOR') setActiveTab('operator');
        else if (user.role === 'QC') setActiveTab('quality');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
      const interval = setInterval(loadData, 5000); // 5 saniyede bir canlı telemetri çek
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Oturum İşlemleri
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Hoş geldiniz, ${user.full_name || user.username}!`);
    if (user.role === 'OPERATOR') setActiveTab('operator');
    else if (user.role === 'QC') setActiveTab('quality');
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('Oturum kapatıldı.');
  };

  // 2. Makine ve İş Emri Durum Güncelleme
  const handleUpdateStationStatus = async (stationId: number, status: WorkstationStatus) => {
    const res = await api.updateWorkstationStatus(stationId, status);
    if (res) {
      await loadData();
      showToast(`Makine durumu güncellendi: ${status}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: WorkOrderStatus, notes?: string) => {
    const res = await api.updateWorkOrderStatus(orderId, status, notes);
    if (res) {
      await loadData();
      showToast(`İş emri durumu: ${status}`);
    }
  };

  const handleCreateWorkOrder = async (newOrder: Partial<WorkOrder> & { product_name?: string }) => {
    const res = await api.createWorkOrder(newOrder);
    if (res) {
      await loadData();
      showToast(`Yeni iş emri veritabanına kaydedildi: ${newOrder.work_order_code}`);
    }
  };

  const handleLogProduction = async (logData: {
    work_order_id: number;
    workstation_id: number;
    produced_quantity: number;
    scrap_quantity: number;
    downtime_minutes: number;
    downtime_reason_id?: number;
    notes?: string;
  }) => {
    await api.logProduction(logData);
    await loadData();
    if (logData.produced_quantity > 0) {
      showToast(`+${logData.produced_quantity} adet sağlam ürün kaydedildi.`);
    } else if (logData.scrap_quantity > 0) {
      showToast(`+${logData.scrap_quantity} adet fire/hurda kaydedildi.`);
    } else if (logData.downtime_minutes > 0) {
      showToast(`⚠️ Duruş kaydı işlendi: ${logData.downtime_minutes} dk.`);
    }
  };

  const handleSubmitInspection = async (inspectionData: {
    work_order_id: number;
    sample_quantity: number;
    accepted_quantity: number;
    rejected_quantity: number;
    decision: QCDecision;
    defect_reason?: string;
  }) => {
    await api.submitQualityInspection(inspectionData);
    await loadData();
    if (inspectionData.decision === 'APPROVED') {
      showToast('✅ Kalite Kabul: Parti onaylandı ve tamamlandı!');
    } else {
      showToast('⚠️ Kalite Ret: Parti yeniden işlemeye (Rework) sevk edildi!');
    }
  };

  const handleOpenOperatorForStation = (stationId: number) => {
    setTargetOperatorStationId(stationId);
    setActiveTab('operator');
  };

  const activeStationsCount = workstations.filter(w => w.status === 'RUNNING').length;
  const stoppedStationsCount = workstations.filter(w => w.status === 'STOPPED').length;
  const qcPendingCount = workOrders.filter(wo => wo.status === 'QUALITY_CHECK').length;

  // EĞER KULLANICI GİRİŞ YAPMAMIŞSA -> LOGIN / KAYIT SAYFASINI GÖSTER
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // GİRİŞ YAPILMIŞSA -> ANA MES PLATFORMU
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Telemetry Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeStationsCount={activeStationsCount}
        stoppedStationsCount={stoppedStationsCount}
        onSimulateTick={loadData}
      />

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 68px)' }}>
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRole={currentUser.role}
          qcPendingCount={qcPendingCount}
        />

        {/* Content Viewport */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              workstations={workstations}
              workOrders={workOrders}
              onOpenOperatorForStation={handleOpenOperatorForStation}
              onUpdateStationStatus={handleUpdateStationStatus}
            />
          )}

          {activeTab === 'work-orders' && (
            <WorkOrdersView
              workOrders={workOrders}
              workstations={workstations}
              onCreateWorkOrder={handleCreateWorkOrder}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'operator' && (
            <OperatorView
              workstations={workstations}
              workOrders={workOrders}
              downtimeReasons={downtimeReasons}
              initialStationId={targetOperatorStationId}
              onLogProduction={handleLogProduction}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateStationStatus={handleUpdateStationStatus}
            />
          )}

          {activeTab === 'quality' && (
            <QualityView
              workOrders={workOrders}
              onSubmitInspection={handleSubmitInspection}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              workOrders={workOrders}
              workstations={workstations}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Box */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--cyan-primary)',
          boxShadow: 'var(--shadow-cyan)',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 999
        }} className="animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
