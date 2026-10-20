import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { OperatorView } from './components/OperatorView';
import { QualityView } from './components/QualityView';
import { AnalyticsView } from './components/AnalyticsView';

import {
  UserRole,
  Workstation,
  WorkOrder,
  DowntimeReason,
  WorkstationStatus,
  WorkOrderStatus,
  QCDecision
} from './types';
import { api, getCurrentUserRole, setCurrentUserRole } from './api';

export function App() {
  const [currentRole, setRole] = useState<UserRole>((getCurrentUserRole() as UserRole) || 'ADMIN');
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

  // 1. Initial Load
  const loadData = async () => {
    const [stations, orders, reasons] = await Promise.all([
      api.getWorkstations(),
      api.getWorkOrders(),
      api.getDowntimeReasons()
    ]);
    setWorkstations(stations);
    setWorkOrders(orders);
    setDowntimeReasons(reasons);
  };

  useEffect(() => {
    loadData();
    // Auto-poll telemetry every 10 seconds for real-time feel
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setRole(role);
    setCurrentUserRole(role);
    showToast(`Rol değiştirildi: ${role}`);
    if (role === 'OPERATOR') setActiveTab('operator');
    else if (role === 'QC') setActiveTab('quality');
  };

  // 2. Machine & Order Status Handlers
  const handleUpdateStationStatus = async (stationId: number, status: WorkstationStatus) => {
    await api.updateWorkstationStatus(stationId, status);
    await loadData();
    showToast(`Makine durumu güncellendi: ${status}`);
  };

  const handleUpdateOrderStatus = async (orderId: number, status: WorkOrderStatus, notes?: string) => {
    await api.updateWorkOrderStatus(orderId, status, notes);
    await loadData();
    showToast(`İş emri durumu: ${status}`);
  };

  const handleCreateWorkOrder = async (newOrder: Partial<WorkOrder>) => {
    await api.createWorkOrder(newOrder);
    await loadData();
    showToast(`Yeni iş emri oluşturuldu: ${newOrder.work_order_code}`);
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

  // Simulation Tick for presentation "Wow" effect
  const handleSimulateTick = () => {
    // Increment active work order on running stations
    const runningStation = workstations.find(w => w.status === 'RUNNING');
    if (runningStation) {
      const activeWO = workOrders.find(wo => wo.workstation_id === runningStation.id);
      if (activeWO) {
        handleLogProduction({
          work_order_id: activeWO.id,
          workstation_id: runningStation.id,
          produced_quantity: 3,
          scrap_quantity: 0,
          downtime_minutes: 0
        });
        showToast(`⚡ Simülasyon: [${runningStation.code}] tezgahında 3 parça daha üretildi!`);
      }
    } else {
      showToast('Simülasyon için en az 1 istasyonun çalışıyor (RUNNING) olması gerekir.');
    }
  };

  const activeStationsCount = workstations.filter(w => w.status === 'RUNNING').length;
  const stoppedStationsCount = workstations.filter(w => w.status === 'STOPPED').length;
  const qcPendingCount = workOrders.filter(wo => wo.status === 'QUALITY_CHECK').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Telemetry Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeStationsCount={activeStationsCount}
        stoppedStationsCount={stoppedStationsCount}
        onSimulateTick={handleSimulateTick}
      />

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 68px)' }}>
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRole={currentRole}
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
