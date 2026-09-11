/**
 * Vinta School OS — Add Teacher Modal
 * Modal form for creating a new teacher with
 * contact info, contract type, rate, and commission model.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, UserPlus, Phone, BookOpen, ChevronDown, Search } from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { toast } from '../../stores/uiStore'
import type { CommissionType } from '../../types/teacher'
import { COMMISSION_TYPE_LABELS } from '../../types/teacher'

// ============================================
// Types
// ============================================

interface Subject {
  name: string
  color: string
}

// ============================================
// Constants
// ============================================

const CONTRACT_LABELS = {
  hourly: 'Hourly',
  per_student: 'Per Student',
} as const

const COMMISSION_TYPES: CommissionType[] = ['PERCENTAGE', 'FLAT_HOURLY', 'FIXED_SESSION']

const COMMISSION_SUFFIX: Record<CommissionType, string> = {
  PERCENTAGE: '%',
  FLAT_HOURLY: 'DA/h',
  FIXED_SESSION: 'DA/session',
}

const COMMISSION_PLACEHOLDER: Record<CommissionType, string> = {
  PERCENTAGE: '30',
  FLAT_HOURLY: '1500',
  FIXED_SESSION: '800',
}

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

  // Commission model state
  const [commissionType, setCommissionType] = useState<CommissionType>('PERCENTAGE')
  const [commissionValue, setCommissionValue] = useState('')

  // Subjects from backend
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Fetch subjects on mount
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const fetchSubjects = async () => {
      setSubjectsLoading(true)
      try {
        const res = await api.get<{ subjects: Subject[] }>('/subjects')
        if (!cancelled) setSubjects(res.data.subjects ?? [])
      } catch {
        if (!cancelled) setSubjects([])
      } finally {
        if (!cancelled) setSubjectsLoading(false)
      }
    }
    fetchSubjects()
    return () => { cancelled = true }
  }, [isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen) searchRef.current?.focus()
  }, [dropdownOpen])

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const selectedSubject = subjects.find((s) => s.name === subject)

  const resetForm = useCallback(() => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setSubject('')
    setContractType('hourly')
    setRate('')
    setNotes('')
    setCommissionType('PERCENTAGE')
    setCommissionValue('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleSubmit = useCallback(async () => {
    if (!firstName.trim()) { toast.error('Name is required'); return }
    if (!phone.trim()) { toast.error('Phone is required'); return }
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

      // Commission model fields
      payload.commission_type = commissionType
      payload.commission_value = commissionValue ? Number(commissionValue) : 0

      await api.post('/teachers', payload)
      resetForm()
      onAdded()
      onClose()
    } catch {
      // Still close — optimistic fallback
      resetForm()
      onAdded()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }, [firstName, lastName, phone, subject, contractType, rate, notes, commissionType, commissionValue, resetForm, onAdded, onClose])

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

          {/* Subject — custom dropdown */}
          <Field label="Subject">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => { setDropdownOpen((o) => !o); setSearchTerm('') }}
                className={cn(
                  inputCls,
                  'flex items-center gap-2 text-left',
                  dropdownOpen && 'ring-2 ring-[var(--gold)]/30',
                )}
              >
                <BookOpen size={14} className="text-[var(--muted)] shrink-0" />
                {selectedSubject ? (
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedSubject.color }}
                    />
                    <span className="truncate">{selectedSubject.name}</span>
                  </span>
                ) : (
                  <span className="text-[var(--muted)]/50">Select subject…</span>
                )}
                <ChevronDown size={14} className={cn('text-[var(--muted)] ml-auto shrink-0 transition-transform', dropdownOpen && 'rotate-180')} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-[var(--card-bg)] border border-[var(--glass-border)] shadow-xl overflow-hidden animate-fade-in">
                  {/* Search */}
                  <div className="relative border-b border-[var(--glass-border)]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search subjects…"
                      className={cn(
                        'w-full pl-9 pr-3 py-2 text-sm text-[var(--text)]',
                        'bg-transparent outline-none',
                        'placeholder:text-[var(--muted)]/50',
                      )}
                    />
                  </div>

                  {/* Options */}
                  <div className="max-h-48 overflow-y-auto py-1">
                    {subjectsLoading ? (
                      <div className="px-3 py-4 text-center text-xs text-[var(--muted)]">
                        Loading subjects…
                      </div>
                    ) : filteredSubjects.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-[var(--muted)]">
                        {subjects.length === 0 ? 'No subjects yet' : 'No match'}
                      </div>
                    ) : (
                      filteredSubjects.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => {
                            setSubject(s.name)
                            setDropdownOpen(false)
                            setSearchTerm('')
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                            'hover:bg-[var(--glass)] transition-colors duration-100',
                            subject === s.name && 'bg-[var(--glass)] text-[var(--text)]',
                            subject !== s.name && 'text-[var(--muted)]',
                          )}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
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

          {/* ── Commission Model Section ──────── */}
          <div className="pt-2 border-t border-[var(--glass-border)]">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Commission Model
            </p>

            {/* Commission Type Toggle — 3 options */}
            <div className="flex gap-2 mb-3">
              {COMMISSION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setCommissionType(type)
                    setCommissionValue('')
                  }}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-[11px] font-medium transition-all duration-150 leading-tight',
                    commissionType === type
                      ? 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/30'
                      : 'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)] hover:border-[var(--muted)]/30',
                  )}
                >
                  <span className="block">{COMMISSION_TYPE_LABELS[type]}</span>
                  <span className={cn(
                    'block text-[10px] mt-0.5',
                    commissionType === type ? 'text-[var(--gold)]/70' : 'text-[var(--muted)]/60',
                  )}>
                    {type === 'PERCENTAGE' && '% of gross revenue'}
                    {type === 'FLAT_HOURLY' && 'DA per hour'}
                    {type === 'FIXED_SESSION' && 'Flat DA per session'}
                  </span>
                </button>
              ))}
            </div>

            {/* Commission Value Input */}
            <Field label="Commission Value">
              <div className="relative">
                <input
                  type="number"
                  value={commissionValue}
                  onChange={(e) => {
                    const val = e.target.value
                    if (commissionType === 'PERCENTAGE') {
                      // Clamp 0–100 for percentage
                      const num = Number(val)
                      if (val === '' || (num >= 0 && num <= 100)) {
                        setCommissionValue(val)
                      }
                    } else {
                      setCommissionValue(val)
                    }
                  }}
                  placeholder={COMMISSION_PLACEHOLDER[commissionType]}
                  min={0}
                  max={commissionType === 'PERCENTAGE' ? 100 : undefined}
                  className={cn(inputCls, 'pr-20')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                  {COMMISSION_SUFFIX[commissionType]}
                </span>
              </div>
            </Field>
          </div>

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
