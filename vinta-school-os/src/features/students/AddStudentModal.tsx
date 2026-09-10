/**
 * Vinta School OS — Add Student Modal
 * Modal form for creating new student records with
 * class enrollment and searchable class selection.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, UserPlus, Search, ChevronDown } from 'lucide-react'
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
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)

  /* ── Options ── */
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])

  /* ── UI state ── */
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ── Refs ── */
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* ── Fetch class options when opened ── */
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function loadOptions() {
      try {
        const classesRes = await api.get('/classes')
        if (cancelled) return

        const data = classesRes.value.data
        setClassOptions(data.classes ?? data ?? [])
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
      setSelectedClassId('')
      setClassSearch('')
      setClassDropdownOpen(false)
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

  /* ── Click outside to close dropdown ── */
  useEffect(() => {
    if (!classDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClassDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [classDropdownOpen])

  /* ── Filtered class options ── */
  const filteredClasses = classOptions.filter((cls) => {
    const q = classSearch.toLowerCase()
    return (
      cls.name.toLowerCase().includes(q) ||
      cls.subject.toLowerCase().includes(q)
    )
  })

  /* ── Selected class object ── */
  const selectedClass = classOptions.find((c) => c.id === selectedClassId) ?? null

  /* ── Color dot for class ── */
  const classColor = useCallback((id: string) => {
    let hash = 0
    for (const ch of id) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash) % 360}, 55%, 50%)`
  }, [])

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await api.post('/students', {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        phone: phone.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        class_id: selectedClassId || undefined,
      })
      if (response.data?.error) {
        setError(response.data.error)
        return
      }
      onCreated?.()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create student. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [firstName, lastName, phone, parentPhone, notes, selectedClassId, onCreated, onClose])

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

          {/* Class Enrollment — Searchable Dropdown */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Class Enrollment
            </h4>
            <div className="relative" ref={dropdownRef}>
              {/* Trigger / Display */}
              {selectedClass ? (
                <div
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
                    'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                    'cursor-pointer group',
                  )}
                  onClick={() => setClassDropdownOpen((p) => !p)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: classColor(selectedClass.id) }}
                    />
                    <span className="text-sm font-medium text-[var(--text)] truncate">
                      {selectedClass.name}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] truncate">
                      {selectedClass.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClassId('')
                        setClassSearch('')
                      }}
                      className={cn(
                        'p-0.5 rounded text-[var(--muted)]',
                        'hover:text-[var(--red)] hover:bg-[var(--red-soft)]',
                        'transition-colors duration-150',
                      )}
                    >
                      <X size={14} />
                    </button>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-[var(--muted)] transition-transform duration-150',
                        classDropdownOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </div>
              ) : (
                /* Empty state — search input */
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    'bg-[var(--input-bg)] border',
                    classDropdownOpen
                      ? 'border-[var(--gold)]/40 ring-2 ring-[var(--gold)]/20'
                      : 'border-[var(--glass-border)]',
                    'transition-all duration-150',
                  )}
                  onClick={() => setClassDropdownOpen(true)}
                >
                  <Search size={14} className="text-[var(--muted)] shrink-0" />
                  <input
                    type="text"
                    value={classSearch}
                    onChange={(e) => {
                      setClassSearch(e.target.value)
                      setClassDropdownOpen(true)
                    }}
                    onFocus={() => setClassDropdownOpen(true)}
                    placeholder="Search classes..."
                    className={cn(
                      'flex-1 bg-transparent outline-none text-sm text-[var(--text)]',
                      'placeholder:text-[var(--muted)]/50',
                    )}
                  />
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-[var(--muted)] transition-transform duration-150',
                      classDropdownOpen && 'rotate-180',
                    )}
                  />
                </div>
              )}

              {/* Dropdown */}
              {classDropdownOpen && (
                <div
                  className={cn(
                    'absolute z-50 mt-1.5 w-full max-h-48 overflow-y-auto',
                    'rounded-lg border border-[var(--glass-border)]',
                    'bg-[var(--glass)] backdrop-blur-xl shadow-xl',
                  )}
                >
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((cls) => {
                      const isSelected = cls.id === selectedClassId
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setSelectedClassId(cls.id)
                            setClassSearch('')
                            setClassDropdownOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 text-left',
                            'text-sm transition-colors duration-100',
                            isSelected
                              ? 'bg-[var(--gold-soft)] text-[var(--text)]'
                              : 'text-[var(--text)] hover:bg-[var(--glass)]',
                          )}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: classColor(cls.id) }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{cls.name}</p>
                            <p className="text-[11px] text-[var(--muted)] truncate">
                              {cls.subject}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--gold)] shrink-0" />
                          )}
                        </button>
                      )
                    })
                  ) : (
                    <p className="px-3 py-3 text-xs text-[var(--muted)] text-center">
                      No classes found
                    </p>
                  )}
                </div>
              )}
            </div>
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
