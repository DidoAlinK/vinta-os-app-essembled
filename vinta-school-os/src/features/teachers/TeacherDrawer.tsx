/**
 * Vinta School OS — Teacher Drawer
 * Slide-in panel from the right showing teacher details,
 * assigned classes, weekly schedule, and payroll summary.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  X,
  Phone,
  Clock,
  Users,
  BookOpen,
  CreditCard,
  Calendar,
  TrendingUp,
  GraduationCap,
  Trash2,
  Plus,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import {
  getInitials,
  formatPhone,
  formatCurrency,
} from '../../lib/formatters'
import type { Teacher } from '../../types/teacher'

// ============================================
// Props
// ============================================

export interface TeacherDrawerProps {
  teacher: Teacher | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (id: string) => void
  onClassCreated?: () => void
}

// ============================================
// Weekly Schedule Mock
// ============================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'] as const

/** Generate a weekly schedule grid based on the teacher's assigned classes */
function generateWeeklySchedule(teacher: Teacher | null) {
  if (!teacher) return []

  const schedule: {
    day: string
    time: string
    className: string
    color: string
  }[] = []

  const classes = teacher.classes_assigned ?? []
  if (classes.length === 0) return schedule

  // Distribute classes across the week
  classes.forEach((cls, i) => {
    const dayIdx = i % DAYS.length
    const timeIdx = Math.floor(i / DAYS.length) % TIME_SLOTS.length

    schedule.push({
      day: DAYS[dayIdx],
      time: TIME_SLOTS[timeIdx],
      className: cls,
      color: `hsl(${(i * 67) % 360}, 50%, 45%)`,
    })
  })

  return schedule
}

// ============================================
// Component
// ============================================

export default function TeacherDrawer({ teacher, isOpen, onClose, onDelete, onClassCreated }: TeacherDrawerProps) {
  const weeklySchedule = generateWeeklySchedule(teacher)

  /* ── Create Class inline form ── */
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [createClassLoading, setCreateClassLoading] = useState(false)
  const [createClassError, setCreateClassError] = useState<string | null>(null)

  /* ── ESC key handler ── */
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  /* ── Click outside handler ── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  /* ── Create Class handler ── */
  const handleCreateClass = useCallback(async () => {
    const trimmed = newClassName.trim()
    if (!trimmed || !teacher) return

    setCreateClassLoading(true)
    setCreateClassError(null)

    try {
      const res = await api.post('/classes', {
        name: trimmed,
        teacher_id: teacher.id,
      })
      if (res.data?.error) {
        setCreateClassError(res.data.error)
        return
      }
      setNewClassName('')
      setShowCreateClass(false)
      onClassCreated?.()
    } catch (err: any) {
      setCreateClassError(err?.response?.data?.error ?? 'Failed to create class.')
    } finally {
      setCreateClassLoading(false)
    }
  }, [newClassName, teacher, onClassCreated])

  /* ── Reset create class state when drawer closes ── */
  useEffect(() => {
    if (!isOpen) {
      setShowCreateClass(false)
      setNewClassName('')
      setCreateClassError(null)
    }
  }, [isOpen])

  /* ── Derived payroll data ── */
  const estimatedPay =
    teacher?.contract_type === 'hourly'
      ? (teacher?.hours_this_week ?? 0) * (teacher?.hourly_rate ?? 0)
      : (teacher?.students_count ?? 0) * (teacher?.per_student_rate ?? 0)

  const weeklyHours = teacher?.hours_this_week ?? 0
  const studentCount = teacher?.students_count ?? 0

  if (!isOpen || !teacher) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

      {/* Drawer */}
      <div
        className={cn(
          'relative h-full w-[400px] max-w-[90vw]',
          'bg-[var(--glass)] border-l border-[var(--glass-border)]',
          'backdrop-blur-xl shadow-2xl',
          'flex flex-col',
          'animate-slide-in-right',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
          <h3
            className="text-base font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Teacher Profile
          </h3>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg',
              'hover:bg-[var(--glass)] text-[var(--muted)]',
              'transition-colors duration-150',
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Content ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Teacher Info */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                'text-lg font-bold',
              )}
              style={{
                background: 'linear-gradient(135deg, var(--violet-soft), var(--emerald-soft))',
                color: 'var(--text)',
              }}
            >
              {getInitials(teacher.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-[var(--text)] truncate">
                {teacher.full_name}
              </h4>
              {teacher.phone && (
                <p className="text-sm text-[var(--muted)] flex items-center gap-1.5 mt-1">
                  <Phone size={13} />
                  {formatPhone(teacher.phone)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                    teacher.contract_type === 'hourly'
                      ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
                      : 'bg-[var(--emerald-soft)] text-[var(--emerald)]',
                  )}
                >
                  {teacher.contract_type === 'hourly' ? 'Hourly' : 'Per Student'}
                </span>
                {teacher.subject && (
                  <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                    <BookOpen size={10} />
                    {teacher.subject}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Classes */}
          <Section
            icon={<BookOpen size={14} />}
            title="Assigned Classes"
          >
            {(teacher.classes_assigned ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {teacher.classes_assigned.map((cls, i) => (
                  <span
                    key={i}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium',
                      'bg-[var(--glass)] border border-[var(--glass-border)]',
                      'text-[var(--text)]',
                    )}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic mb-3">No classes assigned</p>
            )}

            {/* Create Class inline form */}
            {showCreateClass ? (
              <div
                className={cn(
                  'p-3 rounded-lg',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                )}
              >
                <p className="text-xs font-medium text-[var(--muted)] mb-2">New Class</p>
                {createClassError && (
                  <p className="text-[11px] text-[var(--red)] mb-2">{createClassError}</p>
                )}
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleCreateClass()
                    }
                    if (e.key === 'Escape') {
                      setShowCreateClass(false)
                      setNewClassName('')
                      setCreateClassError(null)
                    }
                  }}
                  placeholder="e.g. 1er Lycee"
                  autoFocus
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm text-[var(--text)]',
                    'bg-[var(--glass)] border border-[var(--glass-border)]',
                    'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                    'placeholder:text-[var(--muted)]/50',
                    'transition-shadow duration-150',
                  )}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCreateClass}
                    disabled={!newClassName.trim() || createClassLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium text-white',
                      'hover:opacity-90 active:scale-[0.98]',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-all duration-150',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, var(--gold), var(--emerald))',
                    }}
                  >
                    {createClassLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateClass(false)
                      setNewClassName('')
                      setCreateClassError(null)
                    }}
                    disabled={createClassLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium',
                      'text-[var(--muted)] hover:bg-[var(--glass)]',
                      'transition-colors duration-150',
                      'disabled:opacity-40',
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateClass(true)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                  'text-[var(--gold)] hover:bg-[var(--gold-soft)]',
                  'border border-dashed border-[var(--gold)]/30',
                  'transition-all duration-150',
                  'active:scale-[0.98]',
                )}
              >
                <Plus size={13} />
                Create Class
              </button>
            )}
          </Section>

          {/* Weekly Schedule */}
          <Section
            icon={<Calendar size={14} />}
            title="Weekly Schedule"
          >
            {weeklySchedule.length > 0 ? (
              <div className="space-y-1">
                {DAYS.map((day) => {
                  const daySlots = weeklySchedule.filter((s) => s.day === day)
                  return (
                    <div key={day} className="flex items-start gap-2">
                      <span className="text-[11px] font-semibold text-[var(--muted)] w-8 shrink-0 mt-1">
                        {day}
                      </span>
                      <div className="flex-1 flex flex-wrap gap-1">
                        {daySlots.length > 0 ? (
                          daySlots.map((slot, i) => (
                            <div
                              key={i}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-medium',
                                'text-white',
                              )}
                              style={{ backgroundColor: slot.color }}
                              title={`${slot.time} — ${slot.className}`}
                            >
                              {slot.time} {slot.className}
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-[var(--muted)]/50 italic">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic">No schedule data</p>
            )}
          </Section>

          {/* Payroll Summary */}
          <Section
            icon={<CreditCard size={14} />}
            title="Payroll Summary"
          >
            <div className="grid grid-cols-2 gap-3">
              <PayrollStat
                label="Weekly Hours"
                value={`${weeklyHours}h`}
                icon={<Clock size={12} />}
              />
              <PayrollStat
                label="Students"
                value={`${studentCount}`}
                icon={<Users size={12} />}
              />
              <PayrollStat
                label="Rate"
                value={
                  teacher.contract_type === 'hourly' && teacher.hourly_rate
                    ? `${formatCurrency(teacher.hourly_rate)}/h`
                    : teacher.per_student_rate
                      ? `${formatCurrency(teacher.per_student_rate)}/student`
                      : '—'
                }
                icon={<TrendingUp size={12} />}
              />
              <PayrollStat
                label="Est. Weekly Pay"
                value={formatCurrency(estimatedPay)}
                icon={<GraduationCap size={12} />}
                highlight
              />
            </div>
          </Section>

          {/* Notes */}
          {teacher.notes && (
            <Section icon={<BookOpen size={14} />} title="Notes">
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {teacher.notes}
              </p>
            </Section>
          )}
        </div>

        {/* ── Footer Action ───────────────────────── */}
        <div className="px-5 py-4 border-t border-[var(--glass-border)]">
          <div className="flex gap-2">
            {teacher.phone && (
              <a
                href={`tel:${teacher.phone}`}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--emerald)]/10 text-[var(--emerald)]',
                  'hover:bg-[var(--emerald)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Phone size={15} />
                Call Teacher
              </a>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(teacher.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--red-soft)] text-[var(--red)]',
                  'hover:bg-[var(--red)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Trash2 size={15} />
                Delete Teacher
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section (internal)
// ============================================

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[var(--gold)]">{icon}</span>
        <h5 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          {title}
        </h5>
      </div>
      {children}
    </div>
  )
}

// ============================================
// Payroll Stat (internal)
// ============================================

function PayrollStat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'px-3 py-2.5 rounded-lg',
        'border',
        highlight
          ? 'bg-[var(--gold-soft)]/50 border-[var(--gold)]/20'
          : 'bg-[var(--input-bg)] border-[var(--glass-border)]',
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className={highlight ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}>
          {icon}
        </span>
        <span className="text-[10px] text-[var(--muted)]">{label}</span>
      </div>
      <p
        className={cn(
          'text-sm font-bold',
          highlight ? 'text-[var(--gold)]' : 'text-[var(--text)]',
        )}
      >
        {value}
      </p>
    </div>
  )
}
