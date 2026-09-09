/**
 * Vinta School OS — Student Types
 */

// ============================================
// Student
// ============================================

export interface Student {
  id: string
  academy_id: string
  first_name: string
  last_name: string
  phone?: string
  parent_phone?: string
  notes?: string
  created_at: string
  updated_at: string

  // Computed fields
  full_name: string
  status: 'paid' | 'due' | 'overdue'
  classes: string
  sessions: string
  renews: string
  plan?: string
}

// ============================================
// Guardian
// ============================================

export interface Guardian {
  id: string
  student_id: string
  name: string
  relationship: string
  phone: string
  is_emergency: boolean
  created_at: string
}

// ============================================
// Enrollment
// ============================================

export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  class_name: string
  enrolled_at: string
  status: 'active' | 'withdrawn'
}

// ============================================
// Student Requests
// ============================================

export interface CreateStudentRequest {
  first_name: string
  last_name: string
  phone?: string
  parent_phone?: string
  notes?: string
  guardian?: {
    name: string
    relationship: string
    phone: string
  }
}

export interface UpdateStudentRequest {
  first_name?: string
  last_name?: string
  phone?: string
  parent_phone?: string
  notes?: string
}

export interface CreateGuardianRequest {
  name: string
  relationship: string
  phone: string
  is_emergency?: boolean
}

// ============================================
// Student Stats
// ============================================

export interface StudentStats {
  total: number
  paid: number
  due: number
  overdue: number
}

// ============================================
// Student State
// ============================================

export interface StudentState {
  students: Student[]
  selectedStudent: Student | null
  stats: StudentStats
  isLoading: boolean
  error: string | null

  // Actions
  fetchStudents: () => Promise<void>
  fetchStudent: (id: string) => Promise<void>
  createStudent: (data: CreateStudentRequest) => Promise<Student>
  updateStudent: (id: string, data: UpdateStudentRequest) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  setSelectedStudent: (student: Student | null) => void
}
