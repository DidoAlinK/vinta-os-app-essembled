/**
 * Vinta School OS — Students Page
 * Main page for managing students with stats overview,
 * student table, and add/edit student modal.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Plus,
  Search,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { toast } from '../../stores/uiStore'
import StudentTable from './StudentTable'
import StudentDrawer from './StudentDrawer'
import AddStudentModal from './AddStudentModal'
import type { Student } from '../../types/student'

// ============================================
// Component
// ============================================

export default function StudentsPage() {
  /* ── State ── */
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'due' | 'overdue'>('all')

  /* ── Stats ── */
  const stats = {
    total: students.length,
    paid: students.filter((s) => s.status === 'paid').length,
    overdue: students.filter((s) => s.status === 'overdue').length,
  }

  /* ── Fetch students ── */
  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/students')
      setStudents(data.students ?? data)
    } catch {
      // Error handled by empty state
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  /* ── Handlers ── */
  const handleSelectStudent = useCallback((student: Student) => {
    setSelectedStudent(student)
    setIsDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedStudent(null), 200)
  }, [])

  const handleSaveStudent = useCallback(
    async (formData: {
      first_name: string
      last_name: string
      phone?: string
      parent_phone?: string
      notes?: string
      guardian?: { name: string; relationship: string; phone: string }
    }) => {
      try {
        if (selectedStudent) {
          const { data } = await api.put(`/students/${selectedStudent.id}`, formData)
          setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? { ...s, ...data } : s)),
          )
          toast.success('Student updated successfully')
        } else {
          const { data } = await api.post('/students', formData)
          setStudents((prev) => [data, ...prev])
          toast.success('Student created successfully')
        }
      } catch {
        toast.error('Failed to save. Please try again.')
      }
    },
    [selectedStudent],
  )

  /* ── Filtered list ── */
  const filteredStudents = students.filter((s) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase()
      const matchesSearch =
        s.full_name.toLowerCase().includes(q) ||
        s.phone?.includes(search) ||
        s.classes?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }
    // Status filter
    if (filter !== 'all' && s.status !== filter) return false
    return true
  })

  /* ── Render ── */
  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* ── Page Header ──────────────────────────── */}
      <div className="px-6 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--gold-soft)] flex items-center justify-center">
              <Users size={18} className="text-[var(--gold)]" />
            </div>
            <div>
              <h1
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Students
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Manage student records and billing status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudents}
              className={cn(
                'p-2 rounded-xl text-[var(--muted)]',
                'hover:bg-[var(--glass)] hover:text-[var(--text)]',
                'transition-colors duration-150',
              )}
              title="Refresh"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                'text-white',
                'hover:opacity-90 active:scale-[0.98]',
                'transition-all duration-150',
                'shadow-sm',
              )}
              style={{
                background: 'linear-gradient(135deg, var(--gold), var(--emerald))',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Plus size={16} />
              Add Student
            </button>
          </div>
        </div>

        {/* ── Stats Rail ──────────────────────────── */}
        <div className="flex items-center gap-5 mb-4">
          <StatCard
            label="Total Students"
            value={stats.total}
            color="var(--text)"
            icon={<Users size={14} />}
          />
          <StatCard
            label="Paid"
            value={stats.paid}
            color="var(--emerald)"
            icon={<span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)]" />}
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            color="var(--red-soft)"
            icon={<span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />}
          />
        </div>

        {/* ── Search Bar ──────────────────────────── */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or class..."
            className={cn(
              'w-full pl-9 pr-4 py-2 rounded-xl text-sm text-[var(--text)]',
              'bg-[var(--input-bg)] border border-[var(--glass-border)]',
              'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
              'placeholder:text-[var(--muted)]/50',
              'transition-shadow duration-150',
            )}
          />
        </div>

        {/* ── Filter Pills ───────────────────────── */}
        <div className="flex items-center gap-2 mt-3">
          {([
            { key: 'all', label: 'All' },
            { key: 'paid', label: 'Paid' },
            { key: 'due', label: 'Due' },
            { key: 'overdue', label: 'Overdue' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                'border',
                filter === key
                  ? key === 'paid'
                    ? 'bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/30'
                    : key === 'overdue'
                      ? 'bg-[var(--red-soft)] text-[var(--red)] border-[var(--red)]/30'
                      : key === 'due'
                        ? 'bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30'
                        : 'bg-[var(--glass-strong)] text-[var(--text)] border-[var(--glass-border)]'
                  : 'bg-transparent text-[var(--muted)] border-[var(--glass-border)] hover:text-[var(--text)] hover:border-[var(--muted)]/30',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Student Table ────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <StudentTable
          students={filteredStudents}
          onSelect={handleSelectStudent}
          isLoading={isLoading}
        />
      </div>

      {/* ── Student Drawer ───────────────────────── */}
      <StudentDrawer
        student={selectedStudent}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onUpdated={fetchStudents}
      />

      {/* ── Add Student Modal ────────────────────── */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={fetchStudents}
      />
    </div>
  )
}

// ============================================
// Stat Card (internal)
// ============================================

interface StatCardProps {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl',
        'bg-[var(--glass)] border border-[var(--glass-border)]',
      )}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--text)] leading-none">{value}</p>
        <p className="text-[11px] text-[var(--muted)] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export type { StatCardProps }
