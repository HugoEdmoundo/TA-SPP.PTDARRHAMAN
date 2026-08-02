export type Role = 'ADMIN' | 'SUPERADMIN' | 'WALI' | string;

export interface User {
  id: number;
  username: string;
  email?: string | null;
  full_name: string;
  phone?: string | null;
  role: Role;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy / optional aliases (backend returns full_name)
  name?: string;
  avatar_url?: string;
}

export interface Student {
  id: number;
  nis: string;
  full_name: string;
  gender?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  address?: string | null;
  phone?: string | null;
  academic_year?: string | null; // Deprecated in backend, kept for backward compat
  academic_year_id?: number | null;
  photo_url?: string | null;
  is_active: boolean;
  status: string | null;
  created_at: string;
  updated_at?: string;
  parent_id?: string;
  parent?: Parent;
  // Legacy / optional aliases
  name?: string;
  class_name?: string;
  nisn?: string;
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
  created_at?: string;
}

export interface NonSppBill {
  id: string;
  title: string;
  description?: string;
  category?: string;
  category_id?: number;
  nominal: number;
  student_ids?: string[];
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
  id: number;
  student_id: number;
  bill_id?: number | null;
  payment_type: string;
  spp_month?: number | null;
  spp_year?: number | null;
  amount: number | string;
  infaq_amount: number | string;
  total_amount: number | string;
  method: string;
  channel: string;
  gateway_transaction_id?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  created_at: string;
  receipt?: Receipt | null;
  // Legacy / optional aliases
  invoice_number?: string;
  user_id?: string;
  user?: User;
  student?: Student;
  payment_method?: PaymentMethod;
  payment_url?: string;
  qr_code?: string;
  proof_url?: string;
  items?: PaymentItem[];
  paid_at?: string;
}

export interface SppSetting {
  id: number;
  academic_year?: string | null;
  academic_year_id?: number | null;
  monthly_nominal: number | string;
  due_day: number;
  is_active: boolean;
  effective_from?: string | null;
  effective_to?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SppSettingLog {
  id: number;
  spp_setting_id?: number | null;
  old_nominal?: number | string | null;
  new_nominal: number | string;
  changed_by?: number | null;
  changed_at: string;
  notes?: string | null;
}

export interface SppStatusItem {
  period: number;
  month: number;
  year: number;
  nominal: number;
  total_paid: number;
  status: 'paid' | 'partial' | 'unpaid' | string;
}

export interface SppGridRow {
  student_id: number;
  student_name: string;
  nis: string;
  academic_year: string;
  months: { month: number; year: number; status: string; amount_paid: number }[];
}

export interface Receipt {
  id: number;
  receipt_number: string;
  payment_id: number;
  payment?: Payment;
  pdf_url?: string | null;
  verification_code?: string;
  is_void: boolean;
  void_reason?: string | null;
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
