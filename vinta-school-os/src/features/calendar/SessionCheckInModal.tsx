/**
 * Vinta School OS — Session Check-In Modal
 * Door check-in flow: mark each student as Present / Absent / Guest-swap,
 * then submit with PIN verification.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  X,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Lock,
  Check,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { toast } from '../../stores/uiStore'
import type { Session, SessionStudent, AttendanceStatus } from '../../types/class'

// ============================================
// Types
// ============================================

interface RosterEntry extends SessionStudent {
  subscription_badge?: string | null
  credits_remaining?: number | null
  access_end?: string | null
}

// ============================================
// Props
// ============================================

export interface SessionCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session | null
  onSuccess?: () => void
}

// ============================================
// Status Config
// ============================================

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof UserCheck; color: string; bg: string }> = {
  PRESENT: { label: 'Present', icon: UserCheck, color: 'var(--emerald)', bg: 'var(--emerald-soft)' },
  ABSENT: { label: 'Absent', icon: UserX, color: 'var(--red)', bg: 'var(--red-soft)' },
}

// ============================================
// Component
// ============================================

export default function SessionCheckInModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: SessionCheckInModalProps) {
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'roster' | 'pin' | 'done'>('roster')

  // Student statuses: student_id -> { status, is_group_swap }
  const [statuses, setStatuses] = useState<Record<string, { status: AttendanceStatus; is_group_swap: boolean }>>({})

  // ── Fetch roster on open ──
  useEffect(() => {
    if (!isOpen || !session) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setStep('roster')
      setPin('')
      setStatuses({})
      try {
        const { data } = await api.get(`/attendance/roster/${session!.id}`)
        const entries: RosterEntry[] = data.roster ?? []
        if (!cancelled) {
          setRoster(entries)
          // Initialize all as PRESENT
          const init: Record<string, { status: AttendanceStatus; is_group_swap: boolean }> = {}
          entries.forEach(e => {
            init[e.student_id] = { status: 'PRESENT', is_group_swap: false }
          })
          setStatuses(init)
        }
      } catch {
        if (!cancelled) setRoster([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen, session])

  // ── Toggle student status ──
  const toggleStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setStatuses(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }, [])

  // ── Toggle guest swap ──
  const toggleSwap = useCallback((studentId: string) => {
    setStatuses(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], is_group_swap: !prev[studentId]?.is_group_swap },
    }))
  }, [])

  // ── Submit check-ins ──
  const handleSubmit = useCallback(async () => {
    if (!session || !pin.trim() || pin.length !== 4) return
    setIsSubmitting(true)
    try {
      // Submit each student's check-in
      const promises = roster.map(student => {
        const s = statuses[student.student_id]
        if (!s) return Promise.resolve()
        return api.post('/attendance/check-in', {
          session_id: session.id,
          student_id: student.student_id,
          status: s.status,
          is_group_swap: s.is_group_swap,
          pin: pin.trim(),
        })
      })
      await Promise.all(promises)
      setStep('done')
      toast.success('Check-in recorded', `${roster.length} students processed`)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1200)
    } catch {
      toast.error('Check-in failed', 'Please check the PIN and try again')
    } finally {
      setIsSubmitting(false)
    }
  }, [session, roster, statuses, pin, onSuccess, onClose])

  // ── Stats ──
  const presentCount = Object.values(statuses).filter(s => s.status === 'PRESENT').length
  const absentCount = Object.values(statuses).filter(s => s.status === 'ABSENT').length
  const swapCount = Object.values(statuses).filter(s => s.is_group_swap).length

  if (!isOpen || !session) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(10,10,10,.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={cn(
          'w-full max-w-lg mx-4 rounded-2xl',
          'bg-[var(--card-bg)] border border-[var(--glass-border)]',
          'shadow-2xl animate-fade-in',
          'flex flex-col max-h-[80vh]',
        )}
      >
        {/* ── Header ──────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--gold-soft)' }}
            >
              <UserCheck size={16} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <h2
                className="text-base font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Door Check-In
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {session.class_name} · {session.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--glass)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Content ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 'done' ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'var(--emerald-soft)' }}
              >
                <CheckCircle2 size={28} style={{ color: 'var(--emerald)' }} />
              </div>
              <p className="text-sm font-semibold text-[var(--text)]">Check-In Complete</p>
              <p className="text-xs text-[var(--muted)]">
                {presentCount} present · {absentCount} absent
              </p>
            </div>
          ) : step === 'roster' ? (
            <>
              {/* ── Summary bar ── */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-medium text-[var(--muted)]">
                  {roster.length} student{roster.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1" />
                <span className="text-xs" style={{ color: 'var(--emerald)' }}>
                  {presentCount} present
                </span>
                {absentCount > 0 && (
                  <span className="text-xs" style={{ color: 'var(--red)' }}>
                    {absentCount} absent
                  </span>
                )}
                {swapCount > 0 && (
                  <span className="text-xs" style={{ color: 'var(--gold)' }}>
                    {swapCount} swap{swapCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* ── Student list ── */}
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-[var(--muted)]">No students enrolled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {roster.map(student => {
                    const s = statuses[student.student_id]
                    const isPresent = s?.status === 'PRESENT'
                    const isSwap = s?.is_group_swap

                    return (
                      <div
                        key={student.student_id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                          'border transition-all duration-150',
                          isPresent
                            ? 'border-[var(--emerald)]/20 bg-[var(--emerald-soft)]/30'
                            : 'border-[var(--red)]/20 bg-[var(--red-soft)]/20',
                        )}
                      >
                        {/* Student name + badges */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] truncate">
                            {student.student_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {student.subscription_badge && (
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[9px] font-semibold',
                                  student.subscription_badge === 'DEPLETED' || student.subscription_badge === 'EXPIRED'
                                    ? 'bg-[var(--red-soft)] text-[var(--red)]'
                                    : student.subscription_badge === 'RENEW_REQUIRED'
                                      ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
                                      : 'bg-[var(--gold-soft)] text-[var(--gold)]',
                                )}
                              >
                                {student.subscription_badge}
                              </span>
                            )}
                            {student.credits_remaining != null && (
                              <span className="text-[10px] text-[var(--muted)]">
                                {student.credits_remaining} cr left
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Guest swap toggle */}
                          <button
                            onClick={() => toggleSwap(student.student_id)}
                            className={cn(
                              'p-1.5 rounded-lg transition-all duration-150',
                              isSwap
                                ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
                                : 'text-[var(--muted)] hover:bg-[var(--glass)]',
                            )}
                            title="Group swap"
                          >
                            <ArrowRightLeft size={14} />
                          </button>

                          {/* Present / Absent toggle */}
                          <button
                            onClick={() => toggleStatus(
                              student.student_id,
                              isPresent ? 'ABSENT' : 'PRESENT',
                            )}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                              'transition-all duration-150',
                              isPresent
                                ? 'bg-[var(--emerald)] text-white'
                                : 'bg-[var(--red-soft)] text-[var(--red)] border border-[var(--red)]/20',
                            )}
                          >
                            {isPresent ? <Check size={12} /> : <X size={12} />}
                            {isPresent ? 'Present' : 'Absent'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── Footer: PIN + Submit ────────────── */}
        {step === 'roster' && (
          <div className="px-5 py-4 border-t border-[var(--glass-border)] shrink-0">
            <div className="flex items-center gap-3">
              {/* PIN input */}
              <div className="relative flex-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="PIN"
                  className={cn(
                    'w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-center tracking-[0.3em]',
                    'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                    'text-[var(--text)] outline-none',
                    'focus:ring-2 focus:ring-[var(--gold)]/30',
                    'placeholder:text-[var(--muted)]/50 placeholder:tracking-normal',
                  )}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={pin.length !== 4 || isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white',
                  'bg-gradient-to-r from-[#b3872a] to-[#0f6b4d]',
                  'hover:opacity-90 active:scale-[0.98]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-all duration-150',
                )}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Submit
              </button>
            </div>
            {pin.length > 0 && pin.length < 4 && (
              <p className="text-[10px] text-[var(--muted)] mt-1.5 text-center">
                Enter 4-digit PIN to confirm
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
