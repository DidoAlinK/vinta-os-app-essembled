/**
 * Vinta School OS — Teacher Table
 * Tabular view of teachers with contract badges,
 * rate info, and row-click selection.
 */

import { memo } from 'react'
import {
  Users,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  getInitials,
  formatCurrency,
} from '../../lib/formatters'
import type { Teacher } from '../../types/teacher'

// ============================================
// Props
// ============================================

export interface TeacherTableProps {
  teachers: Teacher[]
  onSelect: (teacher: Teacher) => void
  isLoading?: boolean
}

// ============================================
// Component
// ============================================

function TeacherTable({ teachers, onSelect, isLoading }: TeacherTableProps) {
  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-[var(--gold)] animate-spin" />
      </div>
    )
  }

  /* ── Empty state ── */
  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--glass)] border border-[var(--glass-border)] flex items-center justify-center mb-3">
          <Users size={20} className="text-[var(--muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text)]">No teachers found</p>
        <p className="text-xs text-[var(--muted)] mt-1">
          Add your first teacher to get started
        </p>
      </div>
    )
  }

  /* ── Table ── */
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--glass-border)]',
        'bg-[var(--glass)] overflow-hidden',
      )}
    >
      {/* Header */}
      <div className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_1fr_0.8fr_40px] gap-3 px-4 py-3 border-b border-[var(--glass-border)]">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Teacher
        </span>
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Subject
        </span>
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Contract
        </span>
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Rate
        </span>
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Hours / Students
        </span>
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Classes
        </span>
        <span />
      </div>

      {/* Rows */}
      {teachers.map((teacher, idx) => (
        <button
          key={teacher.id}
          onClick={() => onSelect(teacher)}
          className={cn(
            'w-full grid grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_1fr_0.8fr_40px] gap-3 items-center',
            'px-4 py-3 text-left transition-colors duration-100',
            'hover:bg-[var(--glass)]',
            idx < teachers.length - 1 && 'border-b border-[var(--glass-border)]/50',
          )}
        >
          {/* Name + Avatar */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                'text-[11px] font-bold',
              )}
              style={{
                background: 'linear-gradient(135deg, var(--violet-soft), var(--emerald-soft))',
                color: 'var(--text)',
              }}
            >
              {getInitials(teacher.full_name)}
            </div>
            <p className="text-sm font-medium text-[var(--text)] truncate">
              {teacher.full_name}
            </p>
          </div>

          {/* Subject */}
          <span className="text-sm text-[var(--text)] truncate">
            {teacher.subject || '—'}
          </span>

          {/* Contract Badge */}
          <ContractBadge type={teacher.contract_type} />

          {/* Rate */}
          <span className="text-sm text-[var(--text)]">
            {teacher.contract_type === 'hourly' && teacher.hourly_rate
              ? `${formatCurrency(teacher.hourly_rate)}/h`
              : teacher.contract_type === 'per_student' && teacher.per_student_rate
                ? `${formatCurrency(teacher.per_student_rate)}/student`
                : '—'}
          </span>

          {/* Hours / Students */}
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {teacher.hours_this_week ?? 0}h
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {teacher.students_count ?? 0}
            </span>
          </div>

          {/* Classes */}
          <div className="flex flex-wrap gap-1 min-w-0">
            {(teacher.classes_assigned ?? []).slice(0, 2).map((cls, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium truncate',
                  'bg-[var(--glass)] border border-[var(--glass-border)]',
                  'text-[var(--muted)]',
                )}
              >
                {cls}
              </span>
            ))}
            {(teacher.classes_assigned ?? []).length > 2 && (
              <span className="text-[10px] text-[var(--muted)]">
                +{teacher.classes_assigned.length - 2}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end">
            <ChevronRight size={16} className="text-[var(--muted)]/50" />
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================
// Contract Badge (internal)
// ============================================

function ContractBadge({ type }: { type: string }) {
  const isHourly = type === 'hourly'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium w-fit',
        isHourly
          ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
          : 'bg-[var(--emerald-soft)] text-[var(--emerald)]',
      )}
    >
      {isHourly ? 'Hourly' : 'Per Student'}
    </span>
  )
}

export default memo(TeacherTable)
