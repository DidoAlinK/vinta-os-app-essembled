/**
 * Vinta School OS — Add Student Modal
 * Modal form for creating new student records with
 * class enrollment and payment plan selection.
 */

import { useCallback, useEffect, useState } from 'react'
import { X, UserPlus, Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'

// ============================================
// Types
// ============================================

export interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

interface ClassOption {
  id: string
  name: string
  subject: string
}

interface PaymentPlan {
  id: string
  name: string
  price: number
}

// ============================================
// Component
// ============================================

export default function AddStudentModal({ isOpen, onClose, onCreated }: AddStudentModalProps) {
  /* ── Form state ── */
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [paymentPlanId, setPaymentPlanId] = useState('')

  /* ── Options ── */
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [planOptions, setPlanOptions] = useState<PaymentPlan[]>([])

  /* ── UI state ── */
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ── Fetch class + plan options when opened ── */
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function loadOptions() {
      try {
        const [classesRes, plansRes] = await Promise.allSettled([
          api.get('/classes'),
          api.get('/billing/plans'),
        ])
        if (cancelled) return

        if (classesRes.status === 'fulfilled') {
          const data = classesRes.value.data
          setClassOptions(data.classes ?? data ?? [])
        }
        if (plansRes.status === 'fulfilled') {
          const data = plansRes.value.data
          setPlanOptions(data.plans ?? data ?? [])
        }
      } catch {
        // Options unavailable — form still works without them
      }
    }

    loadOptions()
    return () => { cancelled = true }
  }, [isOpen])

  /* ── Reset form on open ── */
  useEffect(() => {
    if (isOpen) {
      setFirstName('')
      setLastName('')
      setPhone('')
      setParentPhone('')
      setNotes('')
      setSelectedClasses([])
      setPaymentPlanId('')
      setError(null)
    }
  }, [isOpen])

  /* ── ESC handler ── */
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  /* ── Toggle class selection ── */
  const toggleClass = useCallback((classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId],
    )
  }, [])

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast) return

    setIsSubmitting(true)
    setError(null)

    try {
      await api.post('/students', {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        phone: phone.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        class_ids: selectedClasses.length > 0 ? selectedClasses : undefined,
        payment_plan_id: paymentPlanId || undefined,
      })
      onCreated?.()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create student. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [firstName, lastName, phone, parentPhone, notes, selectedClasses, paymentPlanId, onCreated, onClose])

  /* ── Keyboard submit ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  if (!isOpen) return null

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'glass relative z-10 w-full max-w-lg max-h-[85vh]',
          'rounded-2xl shadow-2xl',
          'animate-fade-in-scale',
          'flex flex-col',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--gold-soft)] flex items-center justify-center">
              <UserPlus size={16} className="text-[var(--gold)]" />
            </div>
            <h3
              className="text-base font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Add Student
            </h3>
          </div>
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

        {/* ── Form ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-[var(--red-soft)] text-[var(--red)] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Student Info */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Student Information
            </h4>
            <div className="space-y-3">
              {/* First + Last Name row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First Name" required>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="First name"
                    autoFocus
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Last Name" required>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Last name"
                    className={inputClass}
                  />
                </FormField>
              </div>

              {/* Phone */}
              <FormField label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="+213 5## ## ## ##"
                  className={inputClass}
                />
              </FormField>

              {/* Parent Phone */}
              <FormField label="Parent Phone">
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="+213 5## ## ## ##"
                  className={inputClass}
                />
              </FormField>

              {/* Notes */}
              <FormField label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about the student..."
                  rows={3}
                  className={cn(inputClass, 'resize-none')}
                />
              </FormField>
            </div>
          </div>

          {/* Class Enrollment */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Class Enrollment
            </h4>
            {classOptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {classOptions.map((cls) => {
                  const isSelected = selectedClasses.includes(cls.id)
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm',
                        'border transition-all duration-150',
                        isSelected
                          ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--text)]'
                          : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:border-[var(--muted)]/30',
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded shrink-0 flex items-center justify-center border',
                          isSelected
                            ? 'bg-[var(--gold)] border-[var(--gold)] text-white'
                            : 'border-[var(--glass-border)] bg-transparent',
                        )}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{cls.name}</p>
                        <p className="text-[10px] opacity-60 truncate">{cls.subject}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] py-2">No classes available</p>
            )}
          </div>

          {/* Payment Plan */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Payment Plan
            </h4>
            {planOptions.length > 0 ? (
              <div className="space-y-2">
                {planOptions.map((plan) => {
                  const isSelected = paymentPlanId === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPaymentPlanId(isSelected ? '' : plan.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm',
                        'border transition-all duration-150 text-left',
                        isSelected
                          ? 'bg-[var(--emerald-soft)] border-[var(--emerald)]/40 text-[var(--text)]'
                          : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:border-[var(--muted)]/30',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full shrink-0 flex items-center justify-center border',
                            isSelected
                              ? 'bg-[var(--emerald)] border-[var(--emerald)] text-white'
                              : 'border-[var(--glass-border)] bg-transparent',
                          )}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <span className="text-xs opacity-60">
                        {new Intl.NumberFormat('fr-DZ').format(plan.price)} DA
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] py-2">No payment plans configured</p>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--glass-border)] shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium',
              'text-[var(--muted)] hover:bg-[var(--glass)]',
              'transition-colors duration-150',
              'disabled:opacity-40',
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-medium text-white',
              'hover:opacity-90 active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-all duration-150',
            )}
            style={{
              background: 'linear-gradient(135deg, var(--gold), var(--emerald))',
            }}
          >
            {isSubmitting ? 'Adding...' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// FormField (internal)
// ============================================

function FormField({
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
      <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
        {label}
        {required && <span className="text-[var(--gold)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ============================================
// Shared input styles
// ============================================

const inputClass = cn(
  'w-full px-3 py-2 rounded-lg text-sm text-[var(--text)]',
  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
  'placeholder:text-[var(--muted)]/50',
  'transition-shadow duration-150',
)
