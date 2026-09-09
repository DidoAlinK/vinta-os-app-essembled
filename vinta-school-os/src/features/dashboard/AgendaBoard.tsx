import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '../../lib/cn'
import {
  getCurrentHour,
  formatHour12,
  formatTime12,
  formatDateISO,
  getDayName,
  getWeekDates,
  isToday,
} from '../../lib/formatters'
import {
  CALENDAR_HOURS,
  HOUR_HEIGHT,
} from '../../lib/constants'
import type { Session } from '../../types/class'

/* ─── Types ─── */

interface AgendaBoardProps {
  sessions: Session[]
  selectedSessionId?: string
  onSelectSession: (session: Session) => void
  viewMode: 'week' | 'day'
  onToggleView: () => void
  isLoading?: boolean
}

interface PositionedSession {
  session: Session
  col: number
  totalCols: number
}

/* ─── Overlap Resolution ─── */

/**
 * Resolves overlapping sessions into columns so they render side-by-side.
 * Returns a Map keyed by session id with column index and total column count.
 */
function resolveOverlaps(sessions: Session[]): Map<string, { col: number; totalCols: number }> {
  const result = new Map<string, { col: number; totalCols: number }>()
  if (!sessions.length) return result

  const sorted = [...sessions].sort(
    (a, b) => a.start_hour - b.start_hour || b.duration - a.duration,
  )

  // Build groups of mutually-overlapping sessions
  const groups: Session[][] = []
  let currentGroup = [sorted[0]]
  let groupEnd = sorted[0].end_hour

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start_hour < groupEnd) {
      currentGroup.push(sorted[i])
      groupEnd = Math.max(groupEnd, sorted[i].end_hour)
    } else {
      groups.push(currentGroup)
      currentGroup = [sorted[i]]
      groupEnd = sorted[i].end_hour
    }
  }
  groups.push(currentGroup)

  // Assign columns within each group
  for (const group of groups) {
    const columns: Session[][] = []

    for (const session of group) {
      let placed = false
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1]
        if (lastInCol.end_hour <= session.start_hour) {
          columns[c].push(session)
          result.set(session.id, { col: c, totalCols: 0 })
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([session])
        result.set(session.id, { col: columns.length - 1, totalCols: 0 })
      }
    }

    const totalCols = columns.length
    for (const session of group) {
      result.get(session.id)!.totalCols = totalCols
    }
  }

  return result
}

/* ─── Component ─── */

export function AgendaBoard({
  sessions,
  selectedSessionId,
  onSelectSession,
  viewMode,
  onToggleView,
  isLoading = false,
}: AgendaBoardProps) {
  const [now, setNow] = useState(getCurrentHour)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Current week dates (or single date for day view)
  const days = useMemo(
    () => (viewMode === 'week' ? getWeekDates(new Date()) : [new Date()]),
    [viewMode],
  )

  // Group sessions by their date string
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of sessions) {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    }
    return map
  }, [sessions])

  // Resolve column layout per day
  const positionedByDay = useMemo(() => {
    const map = new Map<string, PositionedSession[]>()
    for (const [date, daySessions] of sessionsByDay) {
      const layout = resolveOverlaps(daySessions)
      map.set(
        date,
        daySessions.map((s) => ({
          session: s,
          col: layout.get(s.id)?.col ?? 0,
          totalCols: layout.get(s.id)?.totalCols ?? 1,
        })),
      )
    }
    return map
  }, [sessionsByDay])

  // Tick the "now" line every 60 s
  useEffect(() => {
    const id = setInterval(() => setNow(getCurrentHour()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll to the current hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      const target = Math.max(0, (getCurrentHour() - CALENDAR_HOURS[0]) * HOUR_HEIGHT - 120)
      scrollRef.current.scrollTop = target
    }
  }, [])

  const totalHeight = CALENDAR_HOURS.length * HOUR_HEIGHT
  const nowOffset = (now - CALENDAR_HOURS[0]) * HOUR_HEIGHT
  const showNowLine = now >= CALENDAR_HOURS[0] && now <= CALENDAR_HOURS[CALENDAR_HOURS.length - 1] + 1

  return (
    <div className="relative flex flex-col h-full rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-[22px] overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--glass-border)]">
        <h2 className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--text)]">
          Agenda
        </h2>

        {/* Week / Day toggle */}
        <div className="flex rounded-lg bg-[var(--input-bg)] p-0.5 border border-[var(--glass-border)]">
          <button
            type="button"
            onClick={() => viewMode !== 'week' && onToggleView()}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all duration-150',
              viewMode === 'week'
                ? 'bg-[var(--gold-soft)] text-[var(--gold)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            )}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => viewMode !== 'day' && onToggleView()}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all duration-150',
              viewMode === 'day'
                ? 'bg-[var(--gold-soft)] text-[var(--gold)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            )}
          >
            Day
          </button>
        </div>
      </div>

      {/* ── Day-header row ── */}
      <div className="flex shrink-0 border-b border-[var(--glass-border)]">
        {/* time-column spacer */}
        <div className="w-16 shrink-0" />

        {days.map((day) => {
          const key = formatDateISO(day)
          const today = isToday(day)
          return (
            <div
              key={key}
              className={cn(
                'flex-1 text-center py-2.5 border-l border-[var(--glass-border)]',
                today && 'bg-[var(--gold-soft)]/20',
              )}
            >
              <div
                className={cn(
                  'text-[10px] uppercase tracking-wider font-medium',
                  today ? 'text-[var(--gold)]' : 'text-[var(--muted)]',
                )}
              >
                {getDayName(day)}
              </div>
              <div
                className={cn(
                  'text-sm font-semibold font-[family-name:var(--font-heading)]',
                  today ? 'text-[var(--gold)]' : 'text-[var(--text)]',
                )}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Scrollable time grid ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex relative" style={{ height: totalHeight }}>
          {/* Time labels */}
          <div className="w-16 shrink-0">
            {CALENDAR_HOURS.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2.5 right-3 text-[10px] text-[var(--muted)] font-medium select-none">
                  {formatHour12(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateKey = formatDateISO(day)
            const daySessions = positionedByDay.get(dateKey) ?? []
            const today = isToday(day)

            return (
              <div
                key={dateKey}
                className={cn(
                  'flex-1 relative border-l border-[var(--glass-border)]',
                  today && 'bg-[var(--gold-soft)]/[0.04]',
                )}
              >
                {/* Hour grid-lines */}
                {CALENDAR_HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-[var(--glass-border)]/40"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {/* Session blocks */}
                {daySessions.map(({ session, col, totalCols }) => {
                  const top = (session.start_hour - CALENDAR_HOURS[0]) * HOUR_HEIGHT
                  const height = Math.max(session.duration * HOUR_HEIGHT, 22)
                  const left = `${(col / totalCols) * 100}%`
                  const width = `${(1 / totalCols) * 100}%`
                  const isSelected = session.id === selectedSessionId

                  return (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectSession(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectSession(session)
                        }
                      }}
                      className={cn(
                        'absolute rounded-md px-1.5 py-1 cursor-pointer overflow-hidden',
                        'transition-all duration-150',
                        'hover:brightness-110 hover:shadow-lg hover:z-10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]',
                        isSelected && [
                          'ring-2 ring-[var(--gold)] z-10',
                          'shadow-[0_0_0_2px_var(--glass),0_0_0_4px_var(--gold)]',
                        ],
                      )}
                      style={{
                        top,
                        height,
                        left,
                        width,
                        backgroundColor: session.color || 'var(--gold)',
                      }}
                    >
                      {height > 28 && (
                        <p className="text-white text-[10px] font-semibold leading-tight truncate drop-shadow-sm">
                          {session.class_name}
                        </p>
                      )}
                      {height > 46 && (
                        <p className="text-white/80 text-[9px] leading-tight truncate">
                          {formatTime12(session.start_hour)}
                        </p>
                      )}
                      {height > 62 && (
                        <p className="text-white/65 text-[9px] leading-tight truncate mt-0.5">
                          {session.teacher_name}
                        </p>
                      )}
                    </div>
                  )
                })}

                {/* Now line — only on today */}
                {today && showNowLine && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: nowOffset }}
                  >
                    <div className="h-[2px] bg-[var(--red)] shadow-[0_0_8px_var(--red)]" />
                    <div className="absolute -left-[3px] -top-[3px] w-[8px] h-[8px] rounded-full bg-[var(--red)]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--glass)]/70 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}

export default AgendaBoard
