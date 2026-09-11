import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../lib/api'
import type { Session } from '../../types/class'
import type { RosterStudent } from './SessionDetail'
import type { ActivityLogEntry } from './ActivityLog'
import AgendaBoard from './AgendaBoard'
import SessionDetail from './SessionDetail'
import ActivityLog from './ActivityLog'
import { Card, CardBody } from '../../components/ui/Card'
import { Users, Calendar, StickyNote } from 'lucide-react'

/* ─── Helpers ─── */
function getWeekRange(date: Date): { start: Date; end: Date; label: string } {
  const d = new Date(date)
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - day) // Sunday (matches AgendaBoard getWeekDates)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (dt: Date) =>
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { start, end, label: `${fmt(start)} – ${fmt(end)}` }
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

/* ─── Stat card config ─── */

interface StatCard {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
}

/* ─── Component ─── */

export function DashboardPage() {
  /* ── State ── */
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  /* ── Stats (mock when no backend) ── */
  const [studentCount, setStudentCount] = useState(0)
  const [todaySessions, setTodaySessions] = useState(0)
  const [activeNotes, setActiveNotes] = useState(0)
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])

  const weekRange = useMemo(() => getWeekRange(currentDate), [currentDate])

  /* ── Fetch sessions ── */
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const endpoint = viewMode === 'week' ? '/calendar/week' : '/calendar/day'
        const dateStr = currentDate.toISOString().split('T')[0]
        const { data } = await api.get(endpoint, {
          params: { date: dateStr },
        })
        if (!cancelled) {
          setSessions(data.sessions ?? data)
        }
      } catch {
        // Backend unavailable — show empty state
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [viewMode, currentDate])

  /* ── Fetch stats ── */
  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const [studentsRes, sessionsRes] = await Promise.all([
          api.get('/students', { params: { limit: 1 } }),
          api.get('/calendar/day', { params: { date: new Date().toISOString().split('T')[0] } }),
        ])
        if (!cancelled) {
          setStudentCount(studentsRes.data.total ?? studentsRes.data.length ?? 0)
          const daySessions = sessionsRes.data.sessions ?? sessionsRes.data ?? []
          setTodaySessions(Array.isArray(daySessions) ? daySessions.length : 0)
        }
      } catch {
        // Backend unavailable
      }
    }
    loadStats()
    return () => { cancelled = true }
  }, [])

  /* ── Fetch activity log ── */
  useEffect(() => {
    let cancelled = false
    async function loadActivities() {
      try {
        const { data } = await api.get('/settings/activity-log')
        if (!cancelled) setActivities(data.activities ?? data ?? [])
      } catch {
        // Backend unavailable
      }
    }
    loadActivities()
    return () => { cancelled = true }
  }, [])

  /* ── Fetch roster when session is selected ── */
  useEffect(() => {
    if (!selectedSession) { setStudents([]); return }
    let cancelled = false
    async function loadStudents() {
      try {
        const { data } = await api.get(`/sessions/${selectedSession!.id}/roster`)
        if (!cancelled) setStudents(data.roster ?? data)
      } catch {
        if (!cancelled) setStudents([])
      }
    }
    loadStudents()
    return () => { cancelled = true }
  }, [selectedSession?.id])

  /* ── Navigation ── */
  const navigateWeek = (dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + dir * 7)
      return d
    })
  }

  const goToToday = () => setCurrentDate(new Date())

  /* ── Handlers ── */
  const handleSelectSession = useCallback((session: Session) => {
    setSelectedSession(prev => prev?.id === session.id ? null : session)
  }, [])

  const handleCloseDetail = useCallback(() => setSelectedSession(null), [])

  const handleTogglePresence = useCallback(async (studentId: string) => {
    if (!selectedSession) return
    // Optimistic toggle
    setStudents(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, is_present: !s.is_present } : s
    ))
    try {
      const current = students.find(s => s.student_id === studentId)
      if (current?.is_present) {
        // Student is present → check-out (no PIN needed)
        await api.post('/attendance/check-out', {
          session_id: selectedSession.id,
          student_id: studentId,
        })
      } else {
        // Student not present → check-in via PIN modal (handled by SessionDetail)
        // For now, just update local state; actual check-in needs PIN
      }
    } catch {
      // Revert on failure
      setStudents(prev => prev.map(s =>
        s.student_id === studentId ? { ...s, is_present: !s.is_present } : s
      ))
    }
  }, [selectedSession, students])

  const handleCyclePayment = useCallback(async (studentId: string) => {
    if (!selectedSession) return
    const next = (cur: string) => cur === 'paid' ? 'due' : cur === 'due' ? 'overdue' : 'paid'
    // Payment status is local-only for now (no backend endpoint)
    setStudents(prev => prev.map(s =>
      s.student_id === studentId
        ? { ...s, payment_status: next(s.payment_status) as RosterStudent['payment_status'] }
        : s
    ))
  }, [selectedSession])

  const handleToggleView = useCallback(() => {
    setViewMode(v => v === 'week' ? 'day' : 'week')
  }, [])

  /* ── Stat cards ── */
  const statCards: StatCard[] = [
    {
      label: 'Students',
      value: studentCount,
      icon: <Users size={20} />,
      color: 'var(--emerald)',
      bgColor: 'var(--emerald-soft)',
    },
    {
      label: "Today's Sessions",
      value: todaySessions,
      icon: <Calendar size={20} />,
      color: 'var(--gold)',
      bgColor: 'var(--gold-soft)',
    },
    {
      label: 'Active Notes',
      value: activeNotes,
      icon: <StickyNote size={20} />,
      color: 'var(--violet)',
      bgColor: 'rgba(139,92,246,.12)',
    },
  ]

  /* ── Render ── */
  return (
    <div className="flex flex-col h-full gap-4 p-2 sm:p-4 overflow-x-hidden overflow-y-auto">
      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardBody className="!p-3">
              <div className="flex items-center gap-2 sm:gap-4">
                <div
                  className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-[var(--radius-sm)] shrink-0"
                  style={{ backgroundColor: card.bgColor, color: card.color }}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-lg sm:text-2xl font-bold text-[var(--text)] font-[family-name:var(--font-heading)] block">
                    {card.value}
                  </span>
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] font-medium truncate">{card.label}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── Date Navigation ── */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-xs)] transition-colors"
          style={{
            background: isToday(currentDate) ? 'var(--gold)' : 'var(--input-bg)',
            color: isToday(currentDate) ? 'white' : 'var(--text)',
            border: '1px solid var(--glass-border)',
          }}
        >
          Today
        </button>
        <button
          onClick={() => navigateWeek(-1)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}
        >
          ‹
        </button>
        <button
          onClick={() => navigateWeek(1)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}
        >
          ›
        </button>
        <span className="text-sm font-semibold text-[var(--text)] font-[family-name:var(--font-heading)]">
          {weekRange.label}
        </span>
      </div>

      {/* ── Main Content: Agenda + Detail/Activity ── */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-0">
        {/* Agenda Board — ~65% */}
        <div className="flex-1 min-w-0 overflow-hidden min-h-[300px]">
          <AgendaBoard
            sessions={sessions}
            selectedSessionId={selectedSession?.id}
            onSelectSession={handleSelectSession}
            viewMode={viewMode}
            onToggleView={handleToggleView}
            isLoading={isLoading}
            currentDate={currentDate}
          />
        </div>

        {/* Right Panel — Session Detail or Activity Log (~35%) */}
        <div className="w-full lg:w-[380px] shrink-0 h-[300px] lg:h-full overflow-hidden">
          {selectedSession ? (
            <SessionDetail
              session={selectedSession}
              students={students}
              onClose={handleCloseDetail}
              onTogglePresence={handleTogglePresence}
              onCyclePayment={handleCyclePayment}
              className="h-full"
            />
          ) : (
            <ActivityLog activities={activities} />
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
