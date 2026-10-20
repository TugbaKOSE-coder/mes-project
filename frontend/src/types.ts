// TypeScript Models for MES Platform

export type UserRole = 'ADMIN' | 'PLANNER' | 'OPERATOR' | 'QC' | 'SHIPMENT';

export type WorkstationStatus = 'IDLE' | 'RUNNING' | 'STOPPED' | 'MAINTENANCE';

export type WorkOrderStatus =
  | 'PENDING'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STOPPED'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'SHIPPED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type QCDecision = 'APPROVED' | 'REJECTED' | 'CONDITIONAL';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface Workstation {
  id: number;
  code: string;
  name: string;
  station_type?: string;
  capacity_per_hour: number;
  status: WorkstationStatus;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
  standard_cycle_time_sec: number;
}

export interface WorkOrder {
  id: number;
  work_order_code: string;
  order_item_id: number;
  product_id: number;
  workstation_id?: number;
  planned_quantity: number;
  produced_quantity: number;
  scrapped_quantity: number;
  status: WorkOrderStatus;
  priority: Priority;
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  assigned_operator_id?: number;
  notes?: string;
  created_at: string;
  product?: Product;
  workstation?: Workstation;
}

export interface DowntimeReason {
  id: number;
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface ProductionLog {
  id: number;
  work_order_id: number;
  workstation_id: number;
  operator_id: number;
  start_time: string;
  end_time?: string;
  produced_quantity: number;
  scrap_quantity: number;
  downtime_minutes: number;
  downtime_reason_id?: number;
  notes?: string;
  created_at: string;
}

export interface QualityInspection {
  id: number;
  work_order_id: number;
  inspector_id: number;
  inspection_date: string;
  sample_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  decision: QCDecision;
  defect_reason?: string;
}
