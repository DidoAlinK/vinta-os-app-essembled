/**
 * Vinta School OS — Teacher Drawer
 * Slide-in panel from the right showing teacher details,
 * assigned classes, weekly schedule, payroll summary, and payout summary.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  Phone,
  Clock,
  Users,
  BookOpen,
  CreditCard,
  Calendar,
  TrendingUp,
  GraduationCap,
  Trash2,
  Plus,
  Wallet,
  Pencil,
  Save,
  ChevronDown,
  Search as SearchIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { toast } from '../../stores/uiStore'
import {
  getInitials,
  formatPhone,
  formatCurrency,
  formatDa,
  formatDateShort,
} from '../../lib/formatters'
import type { Teacher } from '../../types/teacher'
import { COMMISSION_TYPE_LABELS } from '../../types/teacher'
import type { CommissionType } from '../../types/teacher'
import type { PayoutRecord } from '../../types/billing'

// ============================================
// Props
// ============================================

export interface TeacherDrawerProps {
  teacher: Teacher | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (id: string) => void
  onClassCreated?: () => void
  onUpdated?: () => void
}

// ============================================
// Weekly Schedule Mock
// ============================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'] as const

/** Generate a weekly schedule grid based on the teacher's assigned classes */
function generateWeeklySchedule(teacher: Teacher | null) {
  if (!teacher) return []

  const schedule: {
    day: string
    time: string
    className: string
    color: string
  }[] = []

  const classes = teacher.classes_assigned ?? []
  if (classes.length === 0) return schedule

  // Distribute classes across the week
  classes.forEach((cls, i) => {
    const dayIdx = i % DAYS.length
    const timeIdx = Math.floor(i / DAYS.length) % TIME_SLOTS.length

    schedule.push({
      day: DAYS[dayIdx],
      time: TIME_SLOTS[timeIdx],
      className: cls,
      color: `hsl(${(i * 67) % 360}, 50%, 45%)`,
    })
  })

  return schedule
}

// ============================================
// Commission badge label helper
// ============================================

function commissionBadgeLabel(commissionType: CommissionType, commissionValue: number): string {
  switch (commissionType) {
    case 'PERCENTAGE':
      return `${commissionValue}% of gross`
    case 'FLAT_HOURLY':
      return `${formatDa(commissionValue)}/h`
    case 'FIXED_SESSION':
      return `${formatDa(commissionValue)}/session`
  }
}

// ============================================
// Component
// ============================================

export default function TeacherDrawer({ teacher, isOpen, onClose, onDelete, onClassCreated, onUpdated }: TeacherDrawerProps) {
  const weeklySchedule = generateWeeklySchedule(teacher)

  /* ── Create Class inline form ── */
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [createClassLoading, setCreateClassLoading] = useState(false)
  const [createClassError, setCreateClassError] = useState<string | null>(null)

  /* ── Payout summary state ── */
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payoutsError, setPayoutsError] = useState<string | null>(null)

  /* ── Edit mode state ── */
  const [isEditing, setIsEditing] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editContractType, setEditContractType] = useState<'hourly' | 'per_student'>('hourly')
  const [editRate, setEditRate] = useState('')
  const [editCommissionType, setEditCommissionType] = useState<CommissionType>('PERCENTAGE')
  const [editCommissionValue, setEditCommissionValue] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  /* ── Subject dropdown for edit mode ── */
  const [subjects, setSubjects] = useState<{ name: string; color: string }[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  /* ── Create Class handler ── */
  const handleCreateClass = useCallback(async () => {
    const trimmed = newClassName.trim()
    if (!trimmed || !teacher) return

    setCreateClassLoading(true)
    setCreateClassError(null)

    try {
      const res = await api.post('/classes', {
        name: trimmed,
        teacher_id: teacher.id,
      })
      if (res.data?.error) {
        setCreateClassError(res.data.error)
        return
      }
      setNewClassName('')
      setShowCreateClass(false)
      onClassCreated?.()
    } catch (err: any) {
      setCreateClassError(err?.response?.data?.error ?? 'Failed to create class.')
    } finally {
      setCreateClassLoading(false)
    }
  }, [newClassName, teacher, onClassCreated])

  /* ── Edit mode handlers ── */
  const startEditing = useCallback(() => {
    if (!teacher) return
    setEditFirstName(teacher.first_name)
    setEditLastName(teacher.last_name)
    setEditPhone(teacher.phone ?? '')
    setEditSubject(teacher.subject ?? '')
    setEditContractType(teacher.contract_type)
    setEditRate(
      teacher.contract_type === 'hourly'
        ? (teacher.hourly_rate ?? '').toString()
        : (teacher.per_student_rate ?? '').toString(),
    )
    setEditCommissionType(teacher.commission_type ?? 'PERCENTAGE')
    setEditCommissionValue(teacher.commission_value != null ? teacher.commission_value.toString() : '')
    setEditNotes(teacher.notes ?? '')
    setIsEditing(true)
  }, [teacher])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setDropdownOpen(false)
    setSearchTerm('')
  }, [])

  const handleSave = useCallback(async () => {
    if (!teacher) return
    if (!editFirstName.trim()) { toast.error('First name is required'); return }
    setEditSaving(true)
    try {
      const payload: Record<string, unknown> = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim() || undefined,
        subject: editSubject || undefined,
        contract_type: editContractType,
        notes: editNotes.trim() || undefined,
      }
      if (editContractType === 'hourly') {
        payload.hourly_rate = editRate ? Number(editRate) : 0
      } else {
        payload.per_student_rate = editRate ? Number(editRate) : 0
      }
      payload.commission_type = editCommissionType
      payload.commission_value = editCommissionValue ? Number(editCommissionValue) : 0

      await api.put(`/teachers/${teacher.id}`, payload)
      toast.success('Teacher updated successfully')
      setIsEditing(false)
      onUpdated?.()
    } catch {
      toast.error('Failed to update teacher')
    } finally {
      setEditSaving(false)
    }
  }, [teacher, editFirstName, editLastName, editPhone, editSubject, editContractType, editRate, editCommissionType, editCommissionValue, editNotes, onUpdated])

  /* ── Filtered subjects for edit dropdown ── */
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const selectedEditSubject = subjects.find((s) => s.name === editSubject)

  /* ── Reset create class state when drawer closes ── */
  useEffect(() => {
    if (!isOpen) {
      setShowCreateClass(false)
      setNewClassName('')
      setCreateClassError(null)
    }
  }, [isOpen])

  /* ── Fetch payouts when drawer opens ── */
  useEffect(() => {
    if (!isOpen || !teacher) return
    let cancelled = false

    const fetchPayouts = async () => {
      setPayoutsLoading(true)
      setPayoutsError(null)
      try {
        const res = await api.get('/billing/payouts', {
          params: { teacher_id: teacher.id },
        })
        if (!cancelled) {
          setPayouts(res.data?.payouts ?? res.data ?? [])
        }
      } catch {
        if (!cancelled) {
          setPayoutsError('Could not load payout data.')
          setPayouts([])
        }
      } finally {
        if (!cancelled) setPayoutsLoading(false)
      }
    }

    fetchPayouts()
    return () => { cancelled = true }
  }, [isOpen, teacher])

  /* ── Reset payouts when drawer closes ── */
  useEffect(() => {
    if (!isOpen) {
      setPayouts([])
      setPayoutsError(null)
    }
  }, [isOpen])

  /* ── Fetch subjects when entering edit mode ── */
  useEffect(() => {
    if (!isEditing) return
    let cancelled = false
    const fetchSubjects = async () => {
      setSubjectsLoading(true)
      try {
        const res = await api.get<{ subjects: { name: string; color: string }[] }>('/subjects')
        if (!cancelled) setSubjects(res.data.subjects ?? [])
      } catch {
        if (!cancelled) setSubjects([])
      } finally {
        if (!cancelled) setSubjectsLoading(false)
      }
    }
    fetchSubjects()
    return () => { cancelled = true }
  }, [isEditing])

  /* ── Close dropdown on outside click ── */
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

  /* ── Focus search input when dropdown opens ── */
  useEffect(() => {
    if (dropdownOpen) searchRef.current?.focus()
  }, [dropdownOpen])

  /* ── Reset edit state when drawer closes ── */
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
      setDropdownOpen(false)
      setSearchTerm('')
    }
  }, [isOpen])

  /* ── Derived payroll data ── */
  const estimatedPay =
    teacher?.contract_type === 'hourly'
      ? (teacher?.hours_this_week ?? 0) * (teacher?.hourly_rate ?? 0)
      : (teacher?.students_count ?? 0) * (teacher?.per_student_rate ?? 0)

  const weeklyHours = teacher?.hours_this_week ?? 0
  const studentCount = teacher?.students_count ?? 0

  /* ── Derived payout data ── */
  const totalPending = payouts
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.cut_da, 0)
  const totalPaid = payouts
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.cut_da, 0)

  if (!isOpen || !teacher) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

      {/* Drawer */}
      <div
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
            Teacher Profile
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
          {isEditing ? (
            /* ── Edit Form ──────────────────────────── */
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Edit Teacher
              </p>

              {/* First Name */}
              <EditField label="First Name" required>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className={editInputCls}
                />
              </EditField>

              {/* Last Name */}
              <EditField label="Last Name">
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className={editInputCls}
                />
              </EditField>

              {/* Phone */}
              <EditField label="Phone">
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0555 12 34 56"
                  className={editInputCls}
                />
              </EditField>

              {/* Subject — custom dropdown */}
              <EditField label="Subject">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen((o) => !o); setSearchTerm('') }}
                    className={cn(
                      editInputCls,
                      'flex items-center gap-2 text-left',
                      dropdownOpen && 'ring-2 ring-[var(--gold)]/30',
                    )}
                  >
                    <BookOpen size={14} className="text-[var(--muted)] shrink-0" />
                    {selectedEditSubject ? (
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: selectedEditSubject.color }}
                        />
                        <span className="truncate">{selectedEditSubject.name}</span>
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">Select subject…</span>
                    )}
                    <ChevronDown size={14} className={cn('text-[var(--muted)] ml-auto shrink-0 transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-[var(--bg)] border border-[var(--glass-border)] shadow-xl overflow-hidden animate-fade-in">
                      {/* Search */}
                      <div className="relative border-b border-[var(--glass-border)]">
                        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          ref={searchRef}
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search subjects…"
                          className={cn(
                            'w-full pl-9 pr-3 py-2 text-sm text-[var(--text)]',
                            'bg-transparent outline-none',
                            'placeholder:text-[var(--muted)]',
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
                                setEditSubject(s.name)
                                setDropdownOpen(false)
                                setSearchTerm('')
                              }}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                                'hover:bg-[var(--glass)] transition-colors duration-100',
                                editSubject === s.name && 'bg-[var(--gold-soft)] text-[var(--text)] font-medium',
                                editSubject !== s.name && 'text-[var(--text)]',
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
              </EditField>

              {/* Contract Type Toggle */}
              <EditField label="Contract Type">
                <div className="flex gap-2">
                  {(['hourly', 'per_student'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setEditContractType(type); setEditRate('') }}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                        editContractType === type
                          ? type === 'hourly'
                            ? 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/30'
                            : 'bg-[var(--emerald-soft)] text-[var(--emerald)] border border-[var(--emerald)]/30'
                          : 'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)] hover:border-[var(--muted)]/30',
                      )}
                    >
                      {type === 'hourly' ? 'Hourly' : 'Per Student'}
                    </button>
                  ))}
                </div>
              </EditField>

              {/* Rate */}
              <EditField
                label={editContractType === 'hourly' ? 'Hourly Rate' : 'Per Student Rate'}
                required
              >
                <div className="relative">
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    placeholder={editContractType === 'hourly' ? '1500' : '800'}
                    min={0}
                    className={cn(editInputCls, 'pr-14')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                    {editContractType === 'hourly' ? 'DA/h' : 'DA/student'}
                  </span>
                </div>
              </EditField>

              {/* Commission Model */}
              <div className="pt-2 border-t border-[var(--glass-border)]">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                  Commission Model
                </p>

                {/* Commission Type Toggle */}
                <div className="flex gap-2 mb-3">
                  {(['PERCENTAGE', 'FLAT_HOURLY', 'FIXED_SESSION'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setEditCommissionType(type); setEditCommissionValue('') }}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[11px] font-medium transition-all duration-150 leading-tight',
                        editCommissionType === type
                          ? 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/30'
                          : 'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)] hover:border-[var(--muted)]/30',
                      )}
                    >
                      <span className="block">{COMMISSION_TYPE_LABELS[type]}</span>
                      <span className={cn(
                        'block text-[10px] mt-0.5',
                        editCommissionType === type ? 'text-[var(--gold)]/70' : 'text-[var(--muted)]/60',
                      )}>
                        {type === 'PERCENTAGE' && '% of gross revenue'}
                        {type === 'FLAT_HOURLY' && 'DA per hour'}
                        {type === 'FIXED_SESSION' && 'Flat DA per session'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Commission Value Input */}
                <EditField label="Commission Value">
                  <div className="relative">
                    <input
                      type="number"
                      value={editCommissionValue}
                      onChange={(e) => {
                        const val = e.target.value
                        if (editCommissionType === 'PERCENTAGE') {
                          const num = Number(val)
                          if (val === '' || (num >= 0 && num <= 100)) {
                            setEditCommissionValue(val)
                          }
                        } else {
                          setEditCommissionValue(val)
                        }
                      }}
                      placeholder={editCommissionType === 'PERCENTAGE' ? '30' : editCommissionType === 'FLAT_HOURLY' ? '1500' : '800'}
                      min={0}
                      max={editCommissionType === 'PERCENTAGE' ? 100 : undefined}
                      className={cn(editInputCls, 'pr-20')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                      {editCommissionType === 'PERCENTAGE' ? '%' : editCommissionType === 'FLAT_HOURLY' ? 'DA/h' : 'DA/session'}
                    </span>
                  </div>
                </EditField>
              </div>

              {/* Notes */}
              <EditField label="Notes">
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional notes about this teacher…"
                  rows={2}
                  className={cn(editInputCls, 'resize-none')}
                />
              </EditField>

              {/* Edit actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCancelEdit}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium',
                    'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)]',
                    'hover:bg-[var(--glass)] transition-colors duration-150',
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={editSaving}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white',
                    'bg-gradient-to-r from-[#b3872a] to-[#0f6b4d]',
                    'hover:opacity-90 active:scale-[0.98]',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'transition-all duration-150',
                  )}
                >
                  {editSaving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </div>
          ) : (
          {/* Teacher Info */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                'text-lg font-bold',
              )}
              style={{
                background: 'linear-gradient(135deg, var(--violet-soft), var(--emerald-soft))',
                color: 'var(--text)',
              }}
            >
              {getInitials(teacher.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-[var(--text)] truncate">
                {teacher.full_name}
              </h4>
              {teacher.phone && (
                <p className="text-sm text-[var(--muted)] flex items-center gap-1.5 mt-1">
                  <Phone size={13} />
                  {formatPhone(teacher.phone)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Contract type badge */}
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                    teacher.contract_type === 'hourly'
                      ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
                      : 'bg-[var(--emerald-soft)] text-[var(--emerald)]',
                  )}
                >
                  {teacher.contract_type === 'hourly' ? 'Hourly' : 'Per Student'}
                </span>

                {/* Commission model badge */}
                {teacher.commission_type && teacher.commission_value != null && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                      'bg-[var(--glass)] border border-[var(--glass-border)]',
                      'text-[var(--text)]',
                    )}
                  >
                    {commissionBadgeLabel(teacher.commission_type, teacher.commission_value)}
                  </span>
                )}

                {teacher.subject && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text)] gap-1">
                    <BookOpen size={10} />
                    {teacher.subject}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Classes */}
          <Section
            icon={<BookOpen size={14} />}
            title="Assigned Classes"
          >
            {(teacher.classes_assigned ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {teacher.classes_assigned.map((cls, i) => (
                  <span
                    key={i}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium',
                      'bg-[var(--glass)] border border-[var(--glass-border)]',
                      'text-[var(--text)]',
                    )}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic mb-3">No classes assigned</p>
            )}

            {/* Create Class inline form */}
            {showCreateClass ? (
              <div
                className={cn(
                  'p-3 rounded-lg',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                )}
              >
                <p className="text-xs font-medium text-[var(--muted)] mb-2">New Class</p>
                {createClassError && (
                  <p className="text-[11px] text-[var(--red)] mb-2">{createClassError}</p>
                )}
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleCreateClass()
                    }
                    if (e.key === 'Escape') {
                      setShowCreateClass(false)
                      setNewClassName('')
                      setCreateClassError(null)
                    }
                  }}
                  placeholder="e.g. 1er Lycee"
                  autoFocus
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm text-[var(--text)]',
                    'bg-[var(--glass)] border border-[var(--glass-border)]',
                    'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                    'placeholder:text-[var(--muted)]/50',
                    'transition-shadow duration-150',
                  )}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCreateClass}
                    disabled={!newClassName.trim() || createClassLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium text-white',
                      'hover:opacity-90 active:scale-[0.98]',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-all duration-150',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, var(--gold), var(--emerald))',
                    }}
                  >
                    {createClassLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateClass(false)
                      setNewClassName('')
                      setCreateClassError(null)
                    }}
                    disabled={createClassLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium',
                      'text-[var(--muted)] hover:bg-[var(--glass)]',
                      'transition-colors duration-150',
                      'disabled:opacity-40',
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateClass(true)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                  'text-[var(--gold)] hover:bg-[var(--gold-soft)]',
                  'border border-dashed border-[var(--gold)]/30',
                  'transition-all duration-150',
                  'active:scale-[0.98]',
                )}
              >
                <Plus size={13} />
                Create Class
              </button>
            )}
          </Section>

          {/* Weekly Schedule */}
          <Section
            icon={<Calendar size={14} />}
            title="Weekly Schedule"
          >
            {weeklySchedule.length > 0 ? (
              <div className="space-y-1">
                {DAYS.map((day) => {
                  const daySlots = weeklySchedule.filter((s) => s.day === day)
                  return (
                    <div key={day} className="flex items-start gap-2">
                      <span className="text-[11px] font-semibold text-[var(--muted)] w-8 shrink-0 mt-1">
                        {day}
                      </span>
                      <div className="flex-1 flex flex-wrap gap-1">
                        {daySlots.length > 0 ? (
                          daySlots.map((slot, i) => (
                            <div
                              key={i}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-medium',
                                'text-white',
                              )}
                              style={{ backgroundColor: slot.color }}
                              title={`${slot.time} — ${slot.className}`}
                            >
                              {slot.time} {slot.className}
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-[var(--muted)]/50 italic">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic">No schedule data</p>
            )}
          </Section>

          {/* Payroll Summary */}
          <Section
            icon={<CreditCard size={14} />}
            title="Payroll Summary"
          >
            <div className="grid grid-cols-2 gap-3">
              <PayrollStat
                label="Weekly Hours"
                value={`${weeklyHours}h`}
                icon={<Clock size={12} />}
              />
              <PayrollStat
                label="Students"
                value={`${studentCount}`}
                icon={<Users size={12} />}
              />
              <PayrollStat
                label="Rate"
                value={
                  teacher.commission_type && teacher.commission_value != null
                    ? commissionRateLabel(teacher.commission_type, teacher.commission_value)
                    : teacher.contract_type === 'hourly' && teacher.hourly_rate
                      ? `${formatCurrency(teacher.hourly_rate)}/h`
                      : teacher.per_student_rate
                        ? `${formatCurrency(teacher.per_student_rate)}/student`
                        : '—'
                }
                icon={<TrendingUp size={12} />}
              />
              <PayrollStat
                label="Est. Weekly Pay"
                value={formatCurrency(estimatedPay)}
                icon={<GraduationCap size={12} />}
                highlight
              />
            </div>
          </Section>

          {/* Payout Summary */}
          <Section
            icon={<Wallet size={14} />}
            title="Payout Summary"
          >
            {payoutsLoading ? (
              <p className="text-xs text-[var(--muted)] italic">Loading payouts…</p>
            ) : payoutsError ? (
              <p className="text-xs text-[var(--red)]">{payoutsError}</p>
            ) : (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <PayrollStat
                    label="Total Pending"
                    value={formatDa(totalPending)}
                    icon={<Clock size={12} />}
                  />
                  <PayrollStat
                    label="Total Paid"
                    value={formatDa(totalPaid)}
                    icon={<GraduationCap size={12} />}
                    highlight
                  />
                </div>

                {/* Payout rows */}
                {payouts.length > 0 ? (
                  <div className="space-y-1.5">
                    {payouts.map((payout) => (
                      <div
                        key={payout.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg',
                          'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[var(--text)] truncate">
                            {payout.period_start
                              ? formatDateShort(payout.period_start)
                              : '—'}
                            {payout.period_end
                              ? ` – ${formatDateShort(payout.period_end)}`
                              : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[var(--muted)]">
                              Gross {formatDa(payout.gross_da)}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              Cut {formatDa(payout.cut_da)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            payout.status === 'Paid'
                              ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]'
                              : 'bg-[var(--gold-soft)] text-[var(--gold)]',
                          )}
                        >
                          {payout.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)] italic">No payouts recorded yet.</p>
                )}
              </>
            )}
          </Section>

          {/* Notes */}
          {teacher.notes && (
            <Section icon={<BookOpen size={14} />} title="Notes">
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {teacher.notes}
              </p>
            </Section>
          )}
          )}
        </div>

        {/* ── Footer Action ───────────────────────── */}
        <div className="px-5 py-4 border-t border-[var(--glass-border)]">
          <div className="flex gap-2">
            {!isEditing && teacher.phone && (
              <a
                href={`tel:${teacher.phone}`}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--emerald)]/10 text-[var(--emerald)]',
                  'hover:bg-[var(--emerald)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Phone size={15} />
                Call Teacher
              </a>
            )}
            {!isEditing && (
              <button
                onClick={startEditing}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--gold-soft)] text-[var(--gold)]',
                  'hover:bg-[var(--gold)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Pencil size={15} />
                Edit Teacher
              </button>
            )}
            {!isEditing && onDelete && (
              <button
                onClick={() => onDelete(teacher.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--red-soft)] text-[var(--red)]',
                  'hover:bg-[var(--red)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Trash2 size={15} />
                Delete Teacher
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Commission rate label (for Payroll Summary)
// ============================================

function commissionRateLabel(commissionType: CommissionType, commissionValue: number): string {
  switch (commissionType) {
    case 'PERCENTAGE':
      return `${commissionValue}%/session`
    case 'FLAT_HOURLY':
      return `${formatDa(commissionValue)}/h`
    case 'FIXED_SESSION':
      return `${formatDa(commissionValue)}/session`
  }
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
// Payroll Stat (internal)
// ============================================

function PayrollStat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'px-3 py-2.5 rounded-lg',
        'border',
        highlight
          ? 'bg-[var(--gold-soft)]/50 border-[var(--gold)]/20'
          : 'bg-[var(--input-bg)] border-[var(--glass-border)]',
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className={highlight ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}>
          {icon}
        </span>
        <span className="text-[10px] text-[var(--muted)]">{label}</span>
      </div>
      <p
        className={cn(
          'text-sm font-bold',
          highlight ? 'text-[var(--gold)]' : 'text-[var(--text)]',
        )}
      >
        {value}
      </p>
    </div>
  )
}

// ============================================
// Edit Field wrapper (internal)
// ============================================

function EditField({
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
// Edit Input class
// ============================================

const editInputCls = cn(
  'w-full px-3 py-2 rounded-xl text-sm text-[var(--text)]',
  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
  'placeholder:text-[var(--muted)]',
  'transition-shadow duration-150',
)
