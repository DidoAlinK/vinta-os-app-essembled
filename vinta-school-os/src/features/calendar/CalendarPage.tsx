/**
 * Vinta School OS — Calendar Page
 * Full drag-and-drop calendar editor — the primary scheduling interface.
 * Composes SubjectPalette, WeekView, and DayView with view-mode toggling.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../../lib/api'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  X,
  Pencil,
  Check,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  formatDateISO,
  formatDateShort,
  formatTime,
  getWeekDates,
} from '../../lib/formatters'
import SubjectPalette from './SubjectPalette'
import WeekView from './WeekView'
import DayView from './DayView'
import type { Session } from '../../types/class'
import type { Subject, CalendarViewMode } from '../../types/calendar'

// ============================================
// Props
// ============================================

export interface CalendarPageProps {
  sessions: Session[]
  subjects: Subject[]
  isLoading?: boolean
  selectedSession: Session | null

  // Subject management
  onAddSubject: (name: string, color: string) => void
  onDeleteSubject: (id: string) => void

  // Session management
  onMoveSession: (id: string, date: string, time: string) => void
  onResizeSession: (id: string, endTime: string) => void
  onSelectSession: (session: Session) => void
  onClosePanel: () => void
  onDropSubject: (subject: Subject, date: string, time: string) => void

  // Edit panel
  onSaveEdit: (id: string, data: { class_name: string; subject: string; start_time: string; end_time: string }) => void
  onDiscardTemp: (id: string) => void
}

// ============================================
// View Mode Config
// ============================================

const VIEW_MODES: {
  key: CalendarViewMode
  label: string
  icon: typeof Calendar
}[] = [
  { key: 'week', label: 'Week', icon: CalendarRange },
  { key: 'day', label: 'Day', icon: CalendarDays },
]

// ============================================
// Component
// ============================================

export function CalendarPageInner({
  sessions,
  subjects,
  isLoading = false,
  selectedSession,
  onAddSubject,
  onDeleteSubject,
  onMoveSession,
  onResizeSession,
  onSelectSession,
  onClosePanel,
  onDropSubject,
  onSaveEdit,
  onDiscardTemp,
}: CalendarPageProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const editNameRef = useRef<HTMLInputElement>(null)

  // ── Navigation ────────────────────────────────

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setSelectedDate((prev) => {
        const d = new Date(prev)
        if (viewMode === 'day') {
          d.setDate(d.getDate() + direction)
        } else {
          d.setDate(d.getDate() + direction * 7)
        }
        return d
      })
    },
    [viewMode],
  )

  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  // ── Header label ──────────────────────────────

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }

    // Week mode: show range
    const weekDates = getWeekDates(selectedDate)
    const start = weekDates[0]
    const end = weekDates[6]
    const sameMonth = start.getMonth() === end.getMonth()

    if (sameMonth) {
      return `${formatDateShort(start, false)} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`
    }
    return `${formatDateShort(start)} – ${formatDateShort(end)}, ${end.getFullYear()}`
  }, [viewMode, selectedDate])

  // ── MoveSession adapter (for day view) ────────

  const handleDayMove = useCallback(
    (id: string, time: string) => {
      onMoveSession(id, formatDateISO(selectedDate), time)
    },
    [onMoveSession, selectedDate],
  )

  // ── Session selection adapter ────────────────

  const handleSessionSelect = useCallback(
    (session: Session) => {
      setIsEditing(false)
      onSelectSession(session)
    },
    [onSelectSession],
  )

  // ── Edit panel helpers ──────────────────────

  const isTempSession = useCallback(
    (s: Session) => s.id.startsWith('sess-') || s.id.startsWith('temp-'),
    [],
  )

  const startEditing = useCallback((session: Session) => {
    setEditName(session.class_name)
    setEditStartTime(session.start_time)
    setEditEndTime(session.end_time)
    setIsEditing(true)
    // Focus name input after render
    setTimeout(() => editNameRef.current?.focus(), 50)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!selectedSession) return
    const trimmed = editName.trim()
    if (!trimmed) return
    onSaveEdit(selectedSession.id, {
      class_name: trimmed,
      subject: trimmed,
      start_time: editStartTime,
      end_time: editEndTime,
    })
    setIsEditing(false)
  }, [selectedSession, editName, editStartTime, editEndTime, onSaveEdit])

  const handleCancelEdit = useCallback(() => {
    if (!selectedSession) return
    if (isTempSession(selectedSession)) {
      onDiscardTemp(selectedSession.id)
    }
    setIsEditing(false)
  }, [selectedSession, isTempSession, onDiscardTemp])

  const handleClosePanel = useCallback(() => {
    if (selectedSession && isTempSession(selectedSession)) {
      onDiscardTemp(selectedSession.id)
    }
    onClosePanel()
    setIsEditing(false)
  }, [selectedSession, isTempSession, onDiscardTemp, onClosePanel])

  // ── Render ────────────────────────────────────

  return (
    <div className="flex h-full animate-fade-in">
      {/* ── Subject Palette Sidebar ──────────────── */}
      <SubjectPalette
        subjects={subjects}
        onAddSubject={onAddSubject}
        onDeleteSubject={onDeleteSubject}
      />

      {/* ── Main Calendar Area ───────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--divider)] shrink-0">
          {/* Left: title + nav */}
          <div className="flex items-center gap-3">
            <Calendar
              size={20}
              className="text-[var(--gold)]"
            />
            <h1
              className="text-lg font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Calendar
            </h1>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => navigate(-1)}
                className={cn(
                  'p-1.5 rounded-lg hover:bg-[var(--glass)] transition-colors',
                )}
              >
                <ChevronLeft size={16} className="text-[var(--muted)]" />
              </button>

              <button
                onClick={goToToday}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium',
                  'text-[var(--gold)] hover:bg-[var(--gold-soft)]',
                  'transition-colors duration-150',
                )}
              >
                Today
              </button>

              <button
                onClick={() => navigate(1)}
                className={cn(
                  'p-1.5 rounded-lg hover:bg-[var(--glass)] transition-colors',
                )}
              >
                <ChevronRight size={16} className="text-[var(--muted)]" />
              </button>
            </div>

            <span className="text-sm text-[var(--muted)] ml-1">
              {headerLabel}
            </span>
          </div>

          {/* Right: view toggle */}
          <div className="flex items-center bg-[var(--input-bg)] rounded-lg p-0.5 border border-[var(--glass-border)]">
            {VIEW_MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                  viewMode === key
                    ? 'bg-white shadow-sm text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]',
                )}
                style={
                  viewMode === key
                    ? { fontFamily: 'var(--font-heading)' }
                    : undefined
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-[var(--muted)]">
                <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading sessions…</span>
              </div>
            </div>
          ) : viewMode === 'week' ? (
            <WeekView
              sessions={sessions}
              selectedDate={selectedDate}
              onMoveSession={onMoveSession}
              onResizeSession={onResizeSession}
              onSelectSession={handleSessionSelect}
              onDropSubject={onDropSubject}
            />
          ) : (
            <DayView
              sessions={sessions}
              date={selectedDate}
              onMoveSession={handleDayMove}
              onResizeSession={onResizeSession}
              onSelectSession={handleSessionSelect}
            />
          )}
        </div>

        {/* ── Event edit panel (appears after drop or click) ── */}
        {selectedSession && (
          <div
            className={cn(
              'shrink-0 border-t border-[var(--divider)]',
              'bg-[var(--glass)] backdrop-blur-xl',
              'px-5 py-3 animate-fade-in',
            )}
          >
            {isEditing ? (
              /* ── Edit mode ─────────────────────────── */
              <div className="space-y-3">
                {/* Row 1: Name + color + subject */}
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedSession.color }}
                  />
                  <input
                    ref={editNameRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className={cn(
                      'flex-1 px-2 py-1 rounded-lg text-sm font-semibold',
                      'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                      'text-[var(--text)] outline-none',
                      'focus:ring-2 focus:ring-[var(--gold)]/30',
                    )}
                    style={{ fontFamily: 'var(--font-heading)' }}
                  />
                  <span className="text-xs text-[var(--muted)] shrink-0">
                    {selectedSession.subject}
                  </span>
                </div>

                {/* Row 2: Time inputs */}
                <div className="flex items-center gap-3 ml-6">
                  <label className="text-xs text-[var(--muted)]">Start</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs',
                      'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                      'text-[var(--text)] outline-none',
                      'focus:ring-2 focus:ring-[var(--gold)]/30',
                    )}
                  />
                  <label className="text-xs text-[var(--muted)]">End</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs',
                      'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                      'text-[var(--text)] outline-none',
                      'focus:ring-2 focus:ring-[var(--gold)]/30',
                    )}
                  />
                </div>

                {/* Row 3: Actions */}
                <div className="flex items-center justify-end gap-2 ml-6">
                  <button
                    onClick={handleCancelEdit}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium',
                      'text-[var(--muted)] hover:bg-[var(--glass)]',
                      'transition-colors duration-150',
                    )}
                  >
                    {isTempSession(selectedSession) ? 'Discard' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium',
                      'bg-[var(--gold)] text-white',
                      'hover:opacity-90 active:scale-[0.98]',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-all duration-150',
                    )}
                  >
                    <Check size={12} />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read-only mode ────────────────────── */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedSession.color }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold text-[var(--text)]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {selectedSession.class_name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {selectedSession.subject} · {selectedSession.teacher_name || 'No teacher'} ·{' '}
                      {formatTime(selectedSession.start_time)} – {formatTime(selectedSession.end_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEditing(selectedSession)}
                    className="p-1.5 rounded-lg hover:bg-[var(--glass)] transition-colors"
                    title="Edit session"
                  >
                    <Pencil size={14} className="text-[var(--muted)]" />
                  </button>
                  <button
                    onClick={handleClosePanel}
                    className="p-1.5 rounded-lg hover:bg-[var(--glass)] transition-colors"
                  >
                    <X size={14} className="text-[var(--muted)]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Self-contained wrapper (default export)
// ============================================

export default function CalendarPageContainer() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const [sessRes, subRes] = await Promise.all([
          api.get('/calendar/week'),
          api.get('/subjects').catch(() => ({ data: [] })),
        ])
        if (!cancelled) {
          setSessions(sessRes.data.sessions ?? sessRes.data ?? [])
          setSubjects(subRes.data.subjects ?? subRes.data ?? [])
        }
      } catch {
        // Backend unavailable
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleAddSubject = useCallback((name: string, color: string) => {
    const temp: Subject = { id: `temp-${Date.now()}`, name, color }
    setSubjects(prev => [...prev, temp])
  }, [])

  const handleDeleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id))
  }, [])

  const handleMoveSession = useCallback((id: string, date: string, time: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, date, start_time: time } : s))
  }, [])

  const handleResizeSession = useCallback((id: string, endTime: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, end_time: endTime } : s))
  }, [])

  const handleSelectSession = useCallback((session: Session) => {
    setSelectedSession(session)
  }, [])

  const handleDropSubject = useCallback((subject: Subject, date: string, time: string) => {
    const temp: Session = {
      id: `sess-${Date.now()}`, academy_id: '1', class_id: '', class_name: subject.name,
      subject: subject.name, color: subject.color, teacher_id: '', teacher_name: '',
      date, start_time: time, end_time: `${String(Number(time.split(':')[0]) + 2).padStart(2, '0')}:${time.split(':')[1]}`,
      status: 'scheduled', created_at: new Date().toISOString(),
      start_hour: Number(time.split(':')[0]), end_hour: Number(time.split(':')[0]) + 2, duration: 2,
    }
    setSessions(prev => [...prev, temp])
    handleSelectSession(temp)
  }, [handleSelectSession])

  const handleSaveEdit = useCallback((id: string, data: { class_name: string; subject: string; start_time: string; end_time: string }) => {
    setSessions(prev => prev.map(s => s.id === id ? {
      ...s,
      class_name: data.class_name,
      subject: data.subject,
      start_time: data.start_time,
      end_time: data.end_time,
      start_hour: Number(data.start_time.split(':')[0]),
      end_hour: Number(data.end_time.split(':')[0]),
      duration: (Number(data.end_time.split(':')[0]) + Number(data.end_time.split(':')[1] || 0) / 60) - (Number(data.start_time.split(':')[0]) + Number(data.start_time.split(':')[1] || 0) / 60),
    } : s))
    setSelectedSession(prev => prev && prev.id === id ? { ...prev, ...data } : prev)
  }, [])

  const handleDiscardTemp = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    setSelectedSession(null)
  }, [])

  return (
    <CalendarPageInner
      sessions={sessions}
      subjects={subjects}
      isLoading={isLoading}
      selectedSession={selectedSession}
      onAddSubject={handleAddSubject}
      onDeleteSubject={handleDeleteSubject}
      onMoveSession={handleMoveSession}
      onResizeSession={handleResizeSession}
      onSelectSession={handleSelectSession}
      onClosePanel={() => setSelectedSession(null)}
      onDropSubject={handleDropSubject}
      onSaveEdit={handleSaveEdit}
      onDiscardTemp={handleDiscardTemp}
    />
  )
}
