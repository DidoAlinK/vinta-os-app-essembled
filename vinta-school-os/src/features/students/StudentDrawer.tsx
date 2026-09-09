/**
 * Vinta School OS — Student Drawer
 * Slide-in panel from the right showing student details,
 * guardians, billing calendar, and contact actions.
 */

import { useCallback, useEffect, useRef } from 'react'
import {
  X,
  Phone,
  MessageCircle,
  User,
  Shield,
  Calendar,
  BookOpen,
  CreditCard,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  getInitials,
  formatPhone,
  getStatusColor,
  getStatusBg,
  formatCurrency,
} from '../../lib/formatters'
import type { Student } from '../../types/student'

// ============================================
// Props
// ============================================

export interface StudentDrawerProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
}

// ============================================
// Billing Calendar Helper
// ============================================

/** Generate 4-week billing mini-grid data */
function generateBillingGrid(student: Student | null) {
  if (!student) return []

  const weeks: { label: string; status: 'paid' | 'missed' | 'pending' }[][] = []
  const today = new Date()

  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() - w * 7)

    const days = ['M', 'T', 'W', 'T', 'F'].map((label, i) => {
      const dayDate = new Date(weekStart)
      dayDate.setDate(weekStart.getDate() + i + 1)

      let status: 'paid' | 'missed' | 'pending' = 'pending'
      if (dayDate < today) {
        // Simulate: most past days are paid, some missed
        status = Math.random() > 0.15 ? 'paid' : 'missed'
      }

      return { label, status }
    })

    weeks.push(days)
  }

  return weeks
}

// ============================================
// Component
// ============================================

export default function StudentDrawer({ student, isOpen, onClose }: StudentDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const billingGrid = generateBillingGrid(student)

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

  if (!isOpen || !student) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

      {/* Drawer */}
      <div
        ref={drawerRef}
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
            Student Profile
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
          {/* Student Info */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                'text-lg font-bold',
              )}
              style={{
                background: 'linear-gradient(135deg, var(--gold-soft), var(--emerald-soft))',
                color: 'var(--gold)',
              }}
            >
              {getInitials(student.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-[var(--text)] truncate">
                {student.full_name}
              </h4>
              {student.phone && (
                <p className="text-sm text-[var(--muted)] flex items-center gap-1.5 mt-1">
                  <Phone size={13} />
                  {formatPhone(student.phone)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                    getStatusBg(student.status),
                    getStatusColor(student.status),
                  )}
                >
                  {student.status}
                </span>
                {student.plan && (
                  <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                    <CreditCard size={10} />
                    {student.plan}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Classes */}
          {student.classes && (
            <Section
              icon={<BookOpen size={14} />}
              title="Enrolled Classes"
            >
              <div className="flex flex-wrap gap-1.5">
                {student.classes.split(',').map((cls, i) => (
                  <span
                    key={i}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium',
                      'bg-[var(--glass)] border border-[var(--glass-border)]',
                      'text-[var(--text)]',
                    )}
                  >
                    {cls.trim()}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Guardians */}
          <Section
            icon={<Shield size={14} />}
            title="Guardians"
          >
            <div className="space-y-2">
              {student.parent_phone ? (
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--glass)] flex items-center justify-center">
                    <User size={14} className="text-[var(--muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">Parent / Guardian</p>
                    <p className="text-xs text-[var(--muted)]">{formatPhone(student.parent_phone)}</p>
                  </div>
                  <a
                    href={`tel:${student.parent_phone}`}
                    className="p-1.5 rounded-lg hover:bg-[var(--glass)] transition-colors"
                  >
                    <Phone size={13} className="text-[var(--emerald)]" />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] italic">No guardians on file</p>
              )}
            </div>
          </Section>

          {/* Billing Calendar */}
          <Section
            icon={<Calendar size={14} />}
            title="Billing Calendar"
          >
            <div className="space-y-1.5">
              {/* Day labels */}
              <div className="grid grid-cols-5 gap-1 mb-1">
                {['M', 'T', 'W', 'T', 'F'].map((label, i) => (
                  <span
                    key={i}
                    className="text-center text-[10px] font-medium text-[var(--muted)]"
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Week rows */}
              {billingGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-5 gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn(
                        'h-6 rounded-sm transition-colors',
                        day.status === 'paid' && 'bg-[var(--emerald)]/20',
                        day.status === 'missed' && 'bg-[var(--red)]/20',
                        day.status === 'pending' && 'bg-[var(--glass)]',
                      )}
                      title={`${day.label} — ${day.status}`}
                    />
                  ))}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--glass-border)]">
                <LegendDot color="var(--emerald)" label="Paid" />
                <LegendDot color="var(--red)" label="Missed" />
                <LegendDot color="var(--glass-border)" label="Pending" />
              </div>
            </div>
          </Section>

          {/* Notes */}
          {student.notes && (
            <Section icon={<BookOpen size={14} />} title="Notes">
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {student.notes}
              </p>
            </Section>
          )}
        </div>

        {/* ── Footer Actions ──────────────────────── */}
        <div className="px-5 py-4 border-t border-[var(--glass-border)]">
          <div className="flex gap-2">
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--emerald)]/10 text-[var(--emerald)]',
                  'hover:bg-[var(--emerald)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Phone size={15} />
                Call
              </a>
            )}
            {student.phone && (
              <a
                href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--emerald-soft)] text-[var(--emerald)]',
                  'hover:bg-[var(--emerald)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <MessageCircle size={15} />
                Message
              </a>
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
// Legend Dot (internal)
// ============================================

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-[var(--muted)]">{label}</span>
    </div>
  )
}
