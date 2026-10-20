import {
  User, Workstation, WorkOrder, ProductionLog, QualityInspection,
  DowntimeReason, WorkOrderStatus, WorkstationStatus, QCDecision
} from './types';

const API_BASE = 'http://127.0.0.1:8000/api';

// Token Management
export const getToken = (): string | null => localStorage.getItem('mes_token');
export const setToken = (token: string) => localStorage.setItem('mes_token', token);
export const removeToken = () => localStorage.removeItem('mes_token');

export const getCurrentUserRole = (): string => localStorage.getItem('mes_role') || 'ADMIN';
export const setCurrentUserRole = (role: string) => localStorage.setItem('mes_role', role);

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Fallback Mock Data in case backend is offline during presentation/dev
const INITIAL_WORKSTATIONS: Workstation[] = [
  { id: 1, code: 'ST-01', name: 'CNC Kesim İstasyonu', station_type: 'Kesim', capacity_per_hour: 30, status: 'RUNNING' },
  { id: 2, code: 'ST-02', name: 'Robotik Kaynak İstasyonu', station_type: 'Kaynak', capacity_per_hour: 25, status: 'IDLE' },
  { id: 3, code: 'ST-03', name: 'Elektrostatik Boya Hattı', station_type: 'Boya', capacity_per_hour: 40, status: 'STOPPED' },
  { id: 4, code: 'ST-04', name: 'Son Montaj & Paketleme', station_type: 'Montaj', capacity_per_hour: 20, status: 'IDLE' },
];

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 101,
    work_order_code: 'WO-2026-001',
    order_item_id: 1,
    product_id: 1,
    workstation_id: 1,
    planned_quantity: 150,
    produced_quantity: 82,
    scrapped_quantity: 3,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    planned_start_time: '2026-10-20T08:00:00Z',
    planned_end_time: '2026-10-20T17:00:00Z',
    created_at: '2026-10-20T07:30:00Z',
    product: { id: 1, code: 'PRD-M01', name: 'Çelik Gövde Plakası', unit: 'ADET', standard_cycle_time_sec: 45 },
    workstation: INITIAL_WORKSTATIONS[0]
  },
  {
    id: 102,
    work_order_code: 'WO-2026-002',
    order_item_id: 2,
    product_id: 2,
    workstation_id: 3,
    planned_quantity: 80,
    produced_quantity: 35,
    scrapped_quantity: 1,
    status: 'STOPPED',
    priority: 'URGENT',
    planned_start_time: '2026-10-20T09:00:00Z',
    planned_end_time: '2026-10-20T14:00:00Z',
    created_at: '2026-10-20T08:15:00Z',
    product: { id: 2, code: 'PRD-B04', name: 'Alüminyum Bağlantı Braketi', unit: 'ADET', standard_cycle_time_sec: 60 },
    workstation: INITIAL_WORKSTATIONS[2],
    notes: '[10:15] Boya püskürtme memesi tıkandı, temizlik yapılıyor.'
  },
  {
    id: 103,
    work_order_code: 'WO-2026-003',
    order_item_id: 3,
    product_id: 3,
    workstation_id: 2,
    planned_quantity: 200,
    produced_quantity: 200,
    scrapped_quantity: 4,
    status: 'QUALITY_CHECK',
    priority: 'MEDIUM',
    planned_start_time: '2026-10-19T13:00:00Z',
    planned_end_time: '2026-10-20T11:00:00Z',
    created_at: '2026-10-19T12:00:00Z',
    product: { id: 3, code: 'PRD-K12', name: 'Kaynaklı Şasi Modülü', unit: 'ADET', standard_cycle_time_sec: 90 },
    workstation: INITIAL_WORKSTATIONS[1]
  },
  {
    id: 104,
    work_order_code: 'WO-2026-004',
    order_item_id: 4,
    product_id: 4,
    planned_quantity: 50,
    produced_quantity: 0,
    scrapped_quantity: 0,
    status: 'PENDING',
    priority: 'LOW',
    created_at: '2026-10-20T10:00:00Z',
    product: { id: 4, code: 'PRD-P99', name: 'Ön Panel Montaj Grubu', unit: 'ADET', standard_cycle_time_sec: 120 }
  }
];

const INITIAL_DOWNTIME_REASONS: DowntimeReason[] = [
  { id: 1, code: 'D-01', name: 'Mekanik Arıza', category: 'MECHANICAL', description: 'Bıçak kırılması veya motor arızası' },
  { id: 2, code: 'D-02', name: 'Elektrik / Sensör', category: 'ELECTRICAL', description: 'Fotosel veya sürücü hatası' },
  { id: 3, code: 'D-03', name: 'Hammadde Yok', category: 'MATERIAL', description: 'Hatta sac/profil kalmadı' },
  { id: 4, code: 'D-04', name: 'Planlı Mola / Çay', category: 'OPERATOR', description: 'Vardiya molası' },
  { id: 5, code: 'D-05', name: 'Kalıp Değişimi', category: 'SETUP', description: 'Yeni modele geçiş hazırlığı' }
];

// In-Memory Storage for state simulation
let localWorkstations = [...INITIAL_WORKSTATIONS];
let localWorkOrders = [...INITIAL_WORK_ORDERS];

export const api = {
  // 1. Auth Login
  login: async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setCurrentUserRole(data.role);
        return { success: true, data };
      }
    } catch {
      // Backend not running, fallback to offline demo authentication
    }
    // Offline Demo Auth Fallback
    const mockRole = username.toLowerCase().includes('op') ? 'OPERATOR' :
                     username.toLowerCase().includes('qc') ? 'QC' :
                     username.toLowerCase().includes('plan') ? 'PLANNER' : 'ADMIN';
    setToken('mock-jwt-token-demo');
    setCurrentUserRole(mockRole);
    return {
      success: true,
      data: {
        access_token: 'mock-jwt-token-demo',
        token_type: 'bearer',
        role: mockRole,
        username: username || 'admin'
      }
    };
  },

  // 2. Workstations
  getWorkstations: async (): Promise<Workstation[]> => {
    try {
      const res = await fetch(`${API_BASE}/workstations`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) return data;
      }
    } catch {
      // Fallback
    }
    return localWorkstations;
  },

  updateWorkstationStatus: async (id: number, status: WorkstationStatus): Promise<Workstation> => {
    try {
      const res = await fetch(`${API_BASE}/workstations/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    localWorkstations = localWorkstations.map(w => w.id === id ? { ...w, status } : w);
    return localWorkstations.find(w => w.id === id)!;
  },

  // 3. Work Orders
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    try {
      const res = await fetch(`${API_BASE}/work-orders`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) return data;
      }
    } catch {
      // Fallback
    }
    return localWorkOrders;
  },

  createWorkOrder: async (newOrder: Partial<WorkOrder>): Promise<WorkOrder> => {
    try {
      const res = await fetch(`${API_BASE}/work-orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newOrder)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const created: WorkOrder = {
      id: Date.now(),
      work_order_code: newOrder.work_order_code || `WO-${Math.floor(Math.random() * 9000 + 1000)}`,
      order_item_id: 1,
      product_id: newOrder.product_id || 1,
      workstation_id: newOrder.workstation_id,
      planned_quantity: newOrder.planned_quantity || 100,
      produced_quantity: 0,
      scrapped_quantity: 0,
      status: newOrder.workstation_id ? 'PLANNED' : 'PENDING',
      priority: newOrder.priority || 'MEDIUM',
      created_at: new Date().toISOString(),
      notes: newOrder.notes,
      product: { id: 1, code: 'PRD-NEW', name: 'Standart Üretim Parçası', unit: 'ADET', standard_cycle_time_sec: 60 },
      workstation: localWorkstations.find(w => w.id === newOrder.workstation_id)
    };
    localWorkOrders = [created, ...localWorkOrders];
    return created;
  },

  updateWorkOrderStatus: async (id: number, status: WorkOrderStatus, notes?: string): Promise<WorkOrder> => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    localWorkOrders = localWorkOrders.map(wo => {
      if (wo.id === id) {
        // Makine durumu entegrasyonu
        if (wo.workstation_id) {
          if (status === 'IN_PROGRESS') api.updateWorkstationStatus(wo.workstation_id, 'RUNNING');
          else if (status === 'STOPPED') api.updateWorkstationStatus(wo.workstation_id, 'STOPPED');
          else if (['QUALITY_CHECK', 'COMPLETED'].includes(status)) api.updateWorkstationStatus(wo.workstation_id, 'IDLE');
        }
        return { ...wo, status, notes: notes ? `${wo.notes || ''} [Güncelleme]: ${notes}` : wo.notes };
      }
      return wo;
    });
    return localWorkOrders.find(wo => wo.id === id)!;
  },

  // 4. Production Logs (Operatör Kaydı)
  logProduction: async (log: { work_order_id: number; workstation_id: number; produced_quantity: number; scrap_quantity: number; downtime_minutes: number; downtime_reason_id?: number; notes?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/production/log`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...log,
          start_time: new Date().toISOString()
        })
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    localWorkOrders = localWorkOrders.map(wo => {
      if (wo.id === log.work_order_id) {
        return {
          ...wo,
          produced_quantity: wo.produced_quantity + log.produced_quantity,
          scrapped_quantity: wo.scrapped_quantity + log.scrap_quantity
        };
      }
      return wo;
    });
    return { success: true };
  },

  // 5. Quality Inspection (QC)
  submitQualityInspection: async (data: { work_order_id: number; sample_quantity: number; accepted_quantity: number; rejected_quantity: number; decision: QCDecision; defect_reason?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/quality/inspect`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    // Kalite kararına göre iş emri durumu güncellenir
    const targetStatus: WorkOrderStatus = data.decision === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS'; // Rework
    await api.updateWorkOrderStatus(data.work_order_id, targetStatus, data.defect_reason);
    return { success: true };
  },

  getDowntimeReasons: async (): Promise<DowntimeReason[]> => {
    try {
      const res = await fetch(`${API_BASE}/production/downtime-reasons`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return INITIAL_DOWNTIME_REASONS;
  }
};
