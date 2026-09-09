/**
 * Vinta School OS — Billing Types
 */

// ============================================
// Payment Plan
// ============================================

export interface PaymentPlan {
  id: string
  academy_id: string
  name: string
  duration_days: number
  amount_da: number
  created_at: string
}

// ============================================
// Student Billing
// ============================================

export interface StudentBilling {
  id: string
  student_id: string
  student_name: string
  payment_plan_id: string
  payment_plan_name: string
  amount_da: number
  status: 'paid' | 'due' | 'overdue'
  due_date: string
  paid_date?: string
  paid_amount?: number
  cycle_start: string
  cycle_end: string
  notes?: string
  created_at: string
  updated_at: string

  // Computed
  days_overdue: number
  aging_bucket: 'recent' | 'aging' | 'critical'
}

// ============================================
// Payment Log
// ============================================

export interface PaymentLog {
  id: string
  student_billing_id: string
  amount_da: number
  payment_method: string
  recorded_by: string
  recorded_by_name: string
  notes?: string
  created_at: string
}

// ============================================
// Billing Stats
// ============================================

export interface BillingStats {
  // Student tuition
  student_total: number
  student_paid: number
  student_due: number
  student_overdue: number

  // Teacher payroll
  teacher_total: number
  teacher_pending: number
  teacher_settled: number
  teacher_overdue: number

  // Revenue
  month_income: number
  total_enrolled: number
}

export interface BillingRingData {
  name: string
  value: number
  color: string
}

// ============================================
// Revenue Chart
// ============================================

export interface RevenueDataPoint {
  month: string
  income: number
  paid: number
  overdue: number
  enrollments: number
  withdrawals: number
  hours: number
  students_per_teacher: number
  avg_revenue: number
  overdue_count: number
}

export interface SubjectRevenue {
  subject: string
  amount: number
  color: string
}

// ============================================
// Billing Requests
// ============================================

export interface CreatePaymentPlanRequest {
  name: string
  duration_days: number
  amount_da: number
}

export interface RecordPaymentRequest {
  student_billing_id: string
  amount_da: number
  payment_method: string
  notes?: string
}

// ============================================
// Aging Bucket
// ============================================

export interface AgingBucket {
  range: string
  count: number
  total_amount: number
  students: {
    student_id: string
    student_name: string
    amount: number
    days_overdue: number
  }[]
}

// ============================================
// Billing State
// ============================================

export interface BillingState {
  plans: PaymentPlan[]
  stats: BillingStats
  overdueList: StudentBilling[]
  revenueData: RevenueDataPoint[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchPlans: () => Promise<void>
  createPlan: (data: CreatePaymentPlanRequest) => Promise<PaymentPlan>
  fetchStats: () => Promise<void>
  fetchOverdue: () => Promise<void>
  fetchRevenue: (property: string) => Promise<void>
  recordPayment: (data: RecordPaymentRequest) => Promise<PaymentLog>
  getStudentBilling: (studentId: string) => Promise<StudentBilling[]>
}
