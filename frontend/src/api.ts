import {
  User, Workstation, WorkOrder, DowntimeReason, WorkOrderStatus,
  WorkstationStatus, QCDecision
} from './types';

const API_BASE = 'http://127.0.0.1:8000/api';

// Token & Session Storage
export const getToken = (): string | null => localStorage.getItem('mes_token');
export const setToken = (token: string) => localStorage.setItem('mes_token', token);
export const removeToken = () => {
  localStorage.removeItem('mes_token');
  localStorage.removeItem('mes_user');
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem('mes_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  localStorage.setItem('mes_user', JSON.stringify(user));
};

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // 1. Kimlik Doğrulama: Login, Register, Me
  login: async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || 'Kullanıcı adı veya şifre hatalı!' };
      }
      const data = await res.json();
      setToken(data.access_token);

      // Oturum açan kullanıcının profilini çek
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      if (meRes.ok) {
        const userProfile = await meRes.json();
        setStoredUser(userProfile);
        return { success: true, user: userProfile };
      }

      return {
        success: true,
        user: { id: 0, username: data.username, full_name: data.username, role: data.role, email: '', is_active: true }
      };
    } catch (err: any) {
      return { success: false, error: 'Sunucuya bağlanılamadı. FastAPI sunucusunun çalıştığından emin olun.' };
    }
  },

  register: async (userData: { username: string; email: string; full_name: string; password: string; role: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || 'Kayıt işlemi başarısız!' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Sunucuya bağlanılamadı. FastAPI sunucusunun çalıştığından emin olun.' };
    }
  },

  resetPassword: async (email: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || 'Şifre sıfırlama işlemi başarısız!' };
      }
      const data = await res.json();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: 'Sunucuya bağlanılamadı. FastAPI sunucusunun çalıştığından emin olun.' };
    }
  },

  getMe: async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
      if (res.ok) {
        const user = await res.json();
        setStoredUser(user);
        return user;
      }
    } catch {
      // Hata durumunda kayıtlı oturum döner
    }
    return getStoredUser();
  },

  logout: () => {
    removeToken();
  },

  // 2. İstasyonlar & Makineler (Tamamen DB'den Çekilir)
  getWorkstations: async (): Promise<Workstation[]> => {
    try {
      const res = await fetch(`${API_BASE}/workstations`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Workstations fetch error:', err);
    }
    return [];
  },

  updateWorkstationStatus: async (id: number, status: WorkstationStatus): Promise<Workstation | null> => {
    try {
      const res = await fetch(`${API_BASE}/workstations/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Update workstation error:', err);
    }
    return null;
  },

  // 3. İş Emirleri (Tamamen DB'den Çekilir)
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    try {
      const res = await fetch(`${API_BASE}/work-orders`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Work orders fetch error:', err);
    }
    return [];
  },

  createWorkOrder: async (newOrder: Partial<WorkOrder> & { product_name?: string }): Promise<WorkOrder | null> => {
    try {
      const res = await fetch(`${API_BASE}/work-orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newOrder)
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      alert(`Hata: ${err.detail || 'İş emri oluşturulamadı'}`);
    } catch (err) {
      console.error('Create work order error:', err);
    }
    return null;
  },

  updateWorkOrderStatus: async (id: number, status: WorkOrderStatus, notes?: string): Promise<WorkOrder | null> => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      alert(`Hata: ${err.detail || 'Durum güncellenemedi'}`);
    } catch (err) {
      console.error('Update work order status error:', err);
    }
    return null;
  },

  // 4. Üretim Logu Girişi (Operatör Adet / Fire / Duruş)
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
    } catch (err) {
      console.error('Log production error:', err);
    }
    return null;
  },

  // 5. Kalite Kontrol Muayenesi
  submitQualityInspection: async (data: { work_order_id: number; sample_quantity: number; accepted_quantity: number; rejected_quantity: number; decision: QCDecision; defect_reason?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/quality/inspect`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Quality inspect error:', err);
    }
    return null;
  },

  // 6. Duruş Nedenleri
  getDowntimeReasons: async (): Promise<DowntimeReason[]> => {
    try {
      const res = await fetch(`${API_BASE}/production/downtime-reasons`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Downtime reasons error:', err);
    }
    return [];
  },

  // 7. Gerçek Zamanlı Dinamik OEE ve Duruş Analitiği (Veritabanından)
  getOeeMetrics: async (): Promise<OeeMetrics> => {
    try {
      const res = await fetch(`${API_BASE}/analytics/oee`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('OEE metrics fetch error:', err);
    }
    return {
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
    };
  }
};

export interface OeeMetrics {
  availability_rate: number;
  performance_rate: number;
  quality_rate: number;
  oee_rate: number;
  shift_planned_minutes: number;
  total_downtime_minutes: number;
  total_planned: number;
  total_produced: number;
  total_scrapped: number;
  standard_cycle_sec: number;
  actual_cycle_sec: number;
  downtime_pareto: Array<{ reason: string; minutes: number; percent: number }>;
}
