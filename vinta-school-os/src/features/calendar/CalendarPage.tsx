/**
 * Vinta School OS — Calendar Page
 * Full drag-and-drop calendar editor — the primary scheduling interface.
 * Composes SubjectPalette, WeekView, and DayView with view-mode toggling.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  formatDateISO,
  formatDateShort,
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

  // Subject management
  onAddSubject: (name: string, color: string) => void
  onDeleteSubject: (id: string) => void

  // Session management
  onMoveSession: (id: string, date: string, time: string) => void
  onResizeSession: (id: string, endTime: string) => void
  onSelectSession: (session: Session) => void
  onDropSubject: (subject: Subject, date: string, time: string) => void
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
  onAddSubject,
  onDeleteSubject,
  onMoveSession,
  onResizeSession,
  onSelectSession,
  onDropSubject,
}: CalendarPageProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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
              onMoveSession={onMoveSession}
              onResizeSession={onResizeSession}
              onSelectSession={onSelectSession}
              onDropSubject={onDropSubject}
            />
          ) : (
            <DayView
              sessions={sessions}
              date={selectedDate}
              onMoveSession={handleDayMove}
              onResizeSession={onResizeSession}
              onSelectSession={onSelectSession}
            />
          )}
        </div>
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

  const handleSelectSession = useCallback((_session: Session) => {}, [])

  const handleDropSubject = useCallback((subject: Subject, date: string, time: string) => {
    const temp: Session = {
      id: `sess-${Date.now()}`, academy_id: '1', class_id: '', class_name: subject.name,
      subject: subject.name, color: subject.color, teacher_id: '', teacher_name: '',
      date, start_time: time, end_time: `${String(Number(time.split(':')[0]) + 2).padStart(2, '0')}:${time.split(':')[1]}`,
      status: 'scheduled', created_at: new Date().toISOString(),
      start_hour: Number(time.split(':')[0]), end_hour: Number(time.split(':')[0]) + 2, duration: 2,
    }
    setSessions(prev => [...prev, temp])
  }, [])

  return (
    <CalendarPageInner
      sessions={sessions}
      subjects={subjects}
      isLoading={isLoading}
      onAddSubject={handleAddSubject}
      onDeleteSubject={handleDeleteSubject}
      onMoveSession={handleMoveSession}
      onResizeSession={handleResizeSession}
      onSelectSession={handleSelectSession}
      onDropSubject={handleDropSubject}
    />
  )
}
