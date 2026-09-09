/**
 * Vinta School OS — Teacher Types
 */

// ============================================
// Teacher
// ============================================

export interface Teacher {
  id: string
  academy_id: string
  first_name: string
  last_name: string
  phone?: string
  subject?: string
  notes?: string
  contract_type: 'hourly' | 'per_student'
  hourly_rate?: number
  per_student_rate?: number
  created_at: string
  updated_at: string

  // Computed fields
  full_name: string
  classes_assigned: string[]
  hours_this_week: number
  students_count: number
}

// ============================================
// Teacher Payroll
// ============================================

export interface TeacherPayroll {
  id: string
  teacher_id: string
  period_start: string
  period_end: string
  total_hours: number
  total_students: number
  rate_applied: number
  calculated_amount: number
  status: 'pending' | 'settled' | 'overdue'
  paid_date?: string
  created_at: string
  updated_at: string
}

// ============================================
// Teacher Hours Log
// ============================================

export interface TeacherHoursLog {
  id: string
  teacher_id: string
  session_id: string
  hours: number
  logged_by: string
  created_at: string
}

// ============================================
// Teacher Requests
// ============================================

export interface CreateTeacherRequest {
  first_name: string
  last_name: string
  phone?: string
  subject?: string
  notes?: string
  contract_type: 'hourly' | 'per_student'
  hourly_rate?: number
  per_student_rate?: number
}

export interface UpdateTeacherRequest {
  first_name?: string
  last_name?: string
  phone?: string
  subject?: string
  notes?: string
  contract_type?: 'hourly' | 'per_student'
  hourly_rate?: number
  per_student_rate?: number
}

// ============================================
// Teacher Stats
// ============================================

export interface TeacherStats {
  total: number
  hourly: number
  per_student: number
}

// ============================================
// Teacher State
// ============================================

export interface TeacherState {
  teachers: Teacher[]
  selectedTeacher: Teacher | null
  stats: TeacherStats
  isLoading: boolean
  error: string | null

  // Actions
  fetchTeachers: () => Promise<void>
  fetchTeacher: (id: string) => Promise<void>
  createTeacher: (data: CreateTeacherRequest) => Promise<Teacher>
  updateTeacher: (id: string, data: UpdateTeacherRequest) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>
  setSelectedTeacher: (teacher: Teacher | null) => void
}
