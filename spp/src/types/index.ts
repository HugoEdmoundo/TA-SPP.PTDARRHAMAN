export type Role = 'ADMIN' | 'SUPERADMIN' | 'WALI' | 'BENDAHARA' | string;

export interface User {
  id: string;
  name: string;
  full_name?: string;
  username?: string;
  email: string;
  role: Role;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  full_name?: string;
  grade: string; // e.g. "X-A", "XI-IPA-1", "XII-IPS-2"
  class_name?: string;
  academic_year?: string; // Deprecated in backend, kept for backward compat
  academic_year_id?: number;
  status: 'active' | 'graduated' | 'transferred' | 'dropout' | 'inactive' | 'ACTIVE' | 'GRADUATED' | 'DROPPED_OUT' | string;
  parent_id?: string;
  parent?: Parent;
  created_at?: string;
}

export interface Parent {
  id: string;
  user_id: string;
  user?: User;
  phone: string;
  address?: string;
  students?: Student[];
  created_at?: string;
}

export interface SchoolSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  favicon?: string;
  spp_nominal_default: number;
  academic_year_current: string;
  updated_at?: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
}

export interface BillCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  default_amount?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type BillStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID' | 'ACTIVE' | string;

export interface SppBill {
  id: string;
  student_id: string;
  student?: Student;
  month: number; // 1 - 12
  year: number; // 2026
  nominal: number;
  paid_amount: number;
  status: BillStatus;
  due_date: string;
  created_at?: string;
}

export interface NonSppBill {
  id: string;
  title: string;
  description?: string;
  category?: string;
  category_id?: number;
  nominal: number;
  target_grade?: string; // If null, applies to specific students or all
  student_ids?: string[];
  due_date: string;
  created_at?: string;
}

export interface NonSppStudentBill {
  id: string;
  non_spp_bill_id: string;
  non_spp_bill?: NonSppBill;
  student_id: string;
  student?: Student;
  nominal: number;
  paid_amount: number;
  status: BillStatus;
  created_at?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  target_nominal: number;
  collected_nominal: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url?: string;
  created_at?: string;
}

export interface EventContribution {
  id: string;
  event_id: string;
  event?: EventItem;
  student_id?: string;
  student?: Student;
  parent_id?: string;
  parent?: Parent;
  contributor_name: string;
  nominal: number;
  message?: string;
  payment_id?: string;
  created_at: string;
}

export type PaymentMethod = string;
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED' | 'VOID' | string;

export interface PaymentItem {
  id: string;
  payment_id: string;
  item_type: 'SPP' | 'NON_SPP' | 'EVENT' | 'INFAQ' | string;
  reference_id?: string; // Bill ID or Event ID
  title: string;
  nominal: number;
}

export interface Payment {
  id: string;
  invoice_number: string;
  user_id: string;
  user?: User;
  student_id?: string;
  student?: Student;
  total_amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  payment_url?: string; // For Gateway
  qr_code?: string; // For QRIS
  proof_url?: string; // For Manual Transfer
  items: PaymentItem[];
  created_at: string;
  paid_at?: string;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  payment_id: string;
  payment?: Payment;
  pdf_url?: string;
  verification_code: string;
  is_void?: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
