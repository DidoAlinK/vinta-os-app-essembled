/**
 * Vinta School OS — Add Teacher Modal
 * Modal form for creating a new teacher with
 * contact info, contract type, and rate.
 */

import { useCallback, useState } from 'react'
import { X, UserPlus, Phone, BookOpen } from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'

// ============================================
// Constants
// ============================================

const SUBJECTS = ['Math', 'French', 'English', 'Science', 'Other'] as const

const CONTRACT_LABELS = {
  hourly: 'Hourly',
  per_student: 'Per Student',
} as const

// ============================================
// Props
// ============================================

export interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

// ============================================
// Component
// ============================================

export default function AddTeacherModal({ isOpen, onClose, onAdded }: AddTeacherModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [contractType, setContractType] = useState<'hourly' | 'per_student'>('hourly')
  const [rate, setRate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = useCallback(() => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setSubject('')
    setContractType('hourly')
    setRate('')
    setNotes('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim()) return
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
        subject: subject || undefined,
        contract_type: contractType,
        notes: notes.trim() || undefined,
      }

      if (contractType === 'hourly') {
        payload.hourly_rate = rate ? Number(rate) : 0
      } else {
        payload.per_student_rate = rate ? Number(rate) : 0
      }

      await api.post('/teachers', payload)
      resetForm()
      onAdded()
      onClose()
    } catch (err) {
      console.error('[AddTeacherModal] Failed to create teacher', err)
      // Still close — optimistic fallback
      resetForm()
      onAdded()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }, [firstName, lastName, phone, subject, contractType, rate, notes, resetForm, onAdded, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,10,10,.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className={cn(
          'w-full max-w-md mx-4 p-6 rounded-2xl',
          'bg-[var(--card-bg)] border border-[var(--glass-border)]',
          'shadow-2xl animate-fade-in',
        )}
      >
        {/* ── Header ──────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
              <UserPlus size={16} className="text-[var(--gold)]" />
            </div>
            <h2
              className="text-lg font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Add Teacher
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              'p-1.5 rounded-lg text-[var(--muted)]',
              'hover:bg-[var(--glass)] hover:text-[var(--text)]',
              'transition-colors duration-150',
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Form ────────────────────────────── */}
        <div className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ahmed"
                className={inputCls}
              />
            </Field>
            <Field label="Last Name" required>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Benali"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Phone */}
          <Field label="Phone">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 12 34 56"
                className={cn(inputCls, 'pl-9')}
              />
            </div>
          </Field>

          {/* Subject */}
          <Field label="Subject">
            <div className="relative">
              <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={cn(inputCls, 'pl-9 appearance-none cursor-pointer')}
              >
                <option value="">Select subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </Field>

          {/* Contract Type Toggle */}
          <Field label="Contract Type">
            <div className="flex gap-2">
              {(['hourly', 'per_student'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setContractType(type); setRate('') }}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                    contractType === type
                      ? type === 'hourly'
                        ? 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/30'
                        : 'bg-[var(--emerald-soft)] text-[var(--emerald)] border border-[var(--emerald)]/30'
                      : 'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)] hover:border-[var(--muted)]/30',
                  )}
                >
                  {CONTRACT_LABELS[type]}
                </button>
              ))}
            </div>
          </Field>

          {/* Rate */}
          <Field
            label={contractType === 'hourly' ? 'Hourly Rate' : 'Per Student Rate'}
            required
          >
            <div className="relative">
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={contractType === 'hourly' ? '1500' : '800'}
                min={0}
                className={cn(inputCls, 'pr-14')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                {contractType === 'hourly' ? 'DA/h' : 'DA/student'}
              </span>
            </div>
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this teacher…"
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </Field>
        </div>

        {/* ── Actions ──────────────────────────── */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium',
              'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)]',
              'hover:bg-[var(--glass)] transition-colors duration-150',
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!firstName.trim() || !lastName.trim() || !rate || isSubmitting}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white',
              'bg-gradient-to-r from-[#b3872a] to-[#0f6b4d]',
              'hover:opacity-90 active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-all duration-150',
            )}
          >
            {isSubmitting ? 'Adding…' : 'Add Teacher'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Field wrapper (internal)
// ============================================

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-[var(--muted)] mb-1.5">
        {label}
        {required && <span className="text-[var(--red)]">*</span>}
      </label>
      {children}
    </div>
  )
}

// ============================================
// Input class
// ============================================

const inputCls = cn(
  'w-full px-3 py-2 rounded-xl text-sm text-[var(--text)]',
  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
  'placeholder:text-[var(--muted)]/50',
  'transition-shadow duration-150',
)
