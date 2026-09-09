/**
 * Vinta School OS — Class Types
 */

// ============================================
// Classroom
// ============================================

export interface Classroom {
  id: string
  academy_id: string
  name: string
  capacity: number
  created_at: string
}

// ============================================
// Class
// ============================================

export interface Class {
  id: string
  academy_id: string
  name: string
  subject: string
  color: string
  teacher_id?: string
  teacher_name?: string
  capacity: number
  enrolled_count: number
  notes?: string
  created_at: string
  updated_at: string

  // Computed
  status: 'full' | 'active' | 'empty'
  schedules: Schedule[]
}

// ============================================
// Schedule
// ============================================

export interface Schedule {
  id: string
  class_id: string
  classroom_id?: string
  classroom_name?: string
  day_of_week: number // 0=Sun, 1=Mon, ..., 6=Sat
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  created_at: string
}

// ============================================
// Session
// ============================================

export interface Session {
  id: string
  academy_id: string
  class_id: string
  class_name: string
  subject: string
  color: string
  schedule_id?: string
  teacher_id: string
  teacher_name: string
  classroom_id?: string
  classroom_name?: string
  date: string // "YYYY-MM-DD"
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string

  // Computed
  start_hour: number
  end_hour: number
  duration: number
}

// ============================================
// Session Student (Attendance)
// ============================================

export interface SessionStudent {
  id: string
  session_id: string
  student_id: string
  student_name: string
  is_present: boolean
  checked_in_at?: string
  checked_out_at?: string
  checked_in_by?: string
  payment_status: 'paid' | 'due' | 'overdue'
  created_at: string
}

// ============================================
// Class Requests
// ============================================

export interface CreateClassRequest {
  name: string
  subject: string
  color?: string
  teacher_id?: string
  capacity: number
  notes?: string
}

export interface UpdateClassRequest {
  name?: string
  subject?: string
  color?: string
  teacher_id?: string
  capacity?: number
  notes?: string
}

export interface CreateClassroomRequest {
  name: string
  capacity: number
}

export interface CreateScheduleRequest {
  class_id: string
  classroom_id?: string
  day_of_week: number
  start_time: string
  end_time: string
}

// ============================================
// Session Requests
// ============================================

export interface CreateSessionRequest {
  class_id: string
  schedule_id?: string
  teacher_id: string
  classroom_id?: string
  date: string
  start_time: string
  end_time: string
}

export interface UpdateSessionRequest {
  date?: string
  start_time?: string
  end_time?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

// ============================================
// Class Stats
// ============================================

export interface ClassStats {
  total: number
  full: number
  active: number
  empty: number
}

// ============================================
// Class State
// ============================================

export interface ClassState {
  classes: Class[]
  classrooms: Classroom[]
  selectedClass: Class | null
  stats: ClassStats
  isLoading: boolean
  error: string | null

  // Actions
  fetchClasses: () => Promise<void>
  fetchClassrooms: () => Promise<void>
  fetchClass: (id: string) => Promise<void>
  createClass: (data: CreateClassRequest) => Promise<Class>
  updateClass: (id: string, data: UpdateClassRequest) => Promise<void>
  deleteClass: (id: string) => Promise<void>
  setSelectedClass: (cls: Class | null) => void
}
