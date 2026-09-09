/**
 * Vinta School OS — Class Detail
 * Detailed view of a single class with schedule blocks and enrolled students.
 * Includes editable header, weekly schedule grid, and student list.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  ChevronLeft,
  Pencil,
  Trash2,
  X,
  Clock,
  Users,
  GraduationCap,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  HOUR_HEIGHT,
  SUBJECT_COLORS,
} from '../../lib/constants'
import {
  formatTime,
  getDayName,
  getInitials,
} from '../../lib/formatters'
import type { Class } from '../../types/class'

// ============================================
// Props
// ============================================

export interface ClassDetailProps {
  cls: Class | null
  isOpen: boolean
  onClose: () => void
}

// ============================================
// Constants
// ============================================

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_INDICES = [1, 2, 3, 4, 5] // Mon–Fri for the schedule grid

const COLOR_PRESETS = [
  '#b3872a',
  '#7c3aed',
  '#0ea5e9',
  '#0f6b4d',
  '#dc2626',
  '#ea580c',
  '#ec4899',
  '#14b8a6',
]

// ============================================
// Helpers
// ============================================

function resolveColor(cls: Class): string {
  return cls.color || SUBJECT_COLORS[cls.subject] || '#75726a'
}

/** Convert "HH:MM" to minutes from midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Get the min/max hours from a set of schedules */
function getScheduleBounds(
  schedules: Class['schedules'],
): { minHour: number; maxHour: number } {
  if (schedules.length === 0) return { minHour: 8, maxHour: 17 }

  let min = 24
  let max = 0
  for (const s of schedules) {
    const startH = parseInt(s.start_time.split(':')[0], 10)
    const endH = parseInt(s.end_time.split(':')[0], 10) + (parseInt(s.end_time.split(':')[1], 10) > 0 ? 1 : 0)
    if (startH < min) min = startH
    if (endH > max) max = endH
  }
  return { minHour: Math.max(min - 1, 6), maxHour: Math.min(max + 1, 21) }
}

// ============================================
// Component
// ============================================

export default function ClassDetail({ cls, isOpen, onClose }: ClassDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editColor, setEditColor] = useState('')

  // Sync edit state when class changes
  useMemo(() => {
    if (cls) {
      setEditName(cls.name)
      setEditSubject(cls.subject)
      setEditColor(cls.color || '')
    }
    setIsEditing(false)
  }, [cls?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const color = cls ? resolveColor(cls) : '#75726a'

  // ── Schedule grid computation ─────────────────

  const { minHour, maxHour } = useMemo(
    () => getScheduleBounds(cls?.schedules || []),
    [cls?.schedules],
  )

  const hours = useMemo(() => {
    const result: number[] = []
    for (let h = minHour; h <= maxHour; h++) result.push(h)
    return result
  }, [minHour, maxHour])

  // Group schedules by weekday
  const schedulesByDay = useMemo(() => {
    const map = new Map<number, Class['schedules']>()
    for (const day of WEEKDAY_INDICES) map.set(day, [])
    if (cls?.schedules) {
      for (const s of cls.schedules) {
        const existing = map.get(s.day_of_week)
        if (existing) existing.push(s)
      }
    }
    return map
  }, [cls?.schedules])

  // ── Handlers ──────────────────────────────────

  const handleStartEdit = useCallback(() => {
    if (!cls) return
    setEditName(cls.name)
    setEditSubject(cls.subject)
    setEditColor(cls.color || '')
    setIsEditing(true)
  }, [cls])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    if (cls) {
      setEditName(cls.name)
      setEditSubject(cls.subject)
      setEditColor(cls.color || '')
    }
  }, [cls])

  const handleSaveEdit = useCallback(() => {
    // In a real app, this would call an API. For now, just close edit mode.
    setIsEditing(false)
  }, [])

  // ── Render ────────────────────────────────────

  if (!isOpen || !cls) return null

  const totalCapacity = cls.capacity
  const enrolled = cls.enrolled_count
  const utilization = totalCapacity > 0 ? enrolled / totalCapacity : 0

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative ml-auto w-full max-w-2xl h-full overflow-y-auto',
          'bg-[var(--bg)] border-l border-[var(--glass-border)]',
          'animate-slide-in-right',
        )}
      >
        <div className="p-6">
          {/* ── Header ────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm',
                'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass)]',
                'transition-colors duration-150',
              )}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleStartEdit}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                      'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass)]',
                      'transition-colors duration-150',
                    )}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                      'text-[var(--red)] hover:bg-[var(--red-soft)]',
                      'transition-colors duration-150',
                    )}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                      'text-[var(--muted)] hover:bg-[var(--glass)]',
                      'transition-colors duration-150',
                    )}
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                      'bg-[var(--gold)] text-white hover:opacity-90',
                      'transition-opacity duration-150',
                    )}
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Class Info ────────────────────────── */}
          <div className="mb-6">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-lg font-bold text-[var(--text)]',
                    'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                    'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                  )}
                  style={{ fontFamily: 'var(--font-heading)' }}
                />
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Subject"
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm text-[var(--text)]',
                    'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                    'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                  )}
                />
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1.5">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setEditColor(preset)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-all duration-150',
                          editColor === preset
                            ? 'border-[var(--text)] scale-110'
                            : 'border-transparent hover:scale-110',
                        )}
                        style={{ backgroundColor: preset }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1
                    className="text-2xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {cls.name}
                  </h1>

                  {cls.status === 'full' && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--red-soft)] text-[var(--red)]">
                      Full
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="text-sm font-medium px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${color}18`,
                      color,
                    }}
                  >
                    {cls.subject}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── Stats Row ─────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Teacher */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={14} className="text-[var(--muted)]" />
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                  Teacher
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--text)] truncate">
                {cls.teacher_name || '—'}
              </p>
            </div>

            {/* Capacity */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-[var(--muted)]" />
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                  Capacity
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">
                {cls.enrolled_count}/{cls.capacity}
              </p>
            </div>

            {/* Sessions */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-[var(--muted)]" />
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                  Schedules
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">
                {cls.schedules.length} slot{cls.schedules.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* ── Weekly Schedule ────────────────────── */}
          {cls.schedules.length > 0 && (
            <div className="mb-6">
              <h2
                className="text-sm font-bold text-[var(--text)] mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Weekly Schedule
              </h2>

              <div className="glass rounded-xl overflow-hidden">
                {/* Schedule mini-grid */}
                <div className="flex">
                  {/* Time gutter */}
                  <div className="w-12 shrink-0 border-r border-[var(--divider)]">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="text-[9px] text-[var(--muted)] text-right pr-2 pt-0.5"
                        style={{ height: 32 }}
                      >
                        {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {WEEKDAY_INDICES.map((dayIdx) => (
                    <div
                      key={dayIdx}
                      className="flex-1 border-l border-[var(--divider)]"
                    >
                      {/* Day header */}
                      <div className="text-center py-1 border-b border-[var(--divider)]">
                        <span className="text-[9px] font-semibold text-[var(--muted)] uppercase">
                          {DAY_LABELS[dayIdx]}
                        </span>
                      </div>

                      {/* Hour cells */}
                      <div className="relative">
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="border-b border-[var(--divider)]/50"
                            style={{ height: 32 }}
                          />
                        ))}

                        {/* Schedule blocks */}
                        {(schedulesByDay.get(dayIdx) || []).map((schedule) => {
                          const startMinutes = timeToMinutes(schedule.start_time)
                          const endMinutes = timeToMinutes(schedule.end_time)
                          const startHour = hours[0] * 60

                          const top = ((startMinutes - startHour) / 60) * 32
                          const height = ((endMinutes - startMinutes) / 60) * 32

                          return (
                            <div
                              key={schedule.id}
                              className="absolute inset-x-0.5 rounded-md"
                              style={{
                                top,
                                height: Math.max(height, 12),
                                backgroundColor: `${color}25`,
                                borderLeft: `2px solid ${color}`,
                              }}
                            >
                              <span
                                className="block text-[8px] font-medium leading-tight px-1 pt-0.5 truncate"
                                style={{ color }}
                              >
                                {formatTime(schedule.start_time)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Enrolled Students ─────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Enrolled Students
              </h2>
              <span className="text-xs text-[var(--muted)]">
                {cls.enrolled_count} of {cls.capacity}
              </span>
            </div>

            {cls.enrolled_count === 0 ? (
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  No students enrolled yet.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Placeholder students — in a real app these would come from an API */}
                {Array.from({ length: Math.min(cls.enrolled_count, 20) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--glass)] transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {String.fromCharCode(65 + (i % 26))}{String.fromCharCode(65 + ((i * 7) % 26))}
                      </div>
                      <span className="text-xs text-[var(--text)]">
                        Student {i + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

