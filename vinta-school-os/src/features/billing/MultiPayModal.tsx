import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/formatters'
import { Modal } from '../../components/ui/Modal'
import type { PaymentMethod } from '../../types/billing'
import type { Student } from '../../types/student'
import type { Class } from '../../types/class'
import {
  Search,
  Plus,
  Trash2,
  Banknote,
  CreditCard,
  Smartphone,
  Check,
} from 'lucide-react'

/* ─── Props ─── */

interface MultiPayModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/* ─── Line item ─── */

interface LineItem {
  id: string
  group_id: string
  group_name: string
  amount_da: number
}

/* ─── Payment method config ─── */

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { key: 'CASH', label: 'Cash', icon: Banknote },
  { key: 'CCP', label: 'CCP', icon: CreditCard },
  { key: 'BARIDI_MOB', label: 'Baridi Mob', icon: Smartphone },
]

/* ─── PIN input ─── */

function PinInput({
  value,
  onChange,
  error,
}: {
  value: string[]
  onChange: (pin: string[]) => void
  error: boolean
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus the first empty input, or the last
    const firstEmpty = value.findIndex((d) => !d)
    const idx = firstEmpty >= 0 ? firstEmpty : 3
    inputRefs.current[idx]?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (index: number, char: string) => {
    if (char && !/^\d$/.test(char)) return
    const next = [...value]
    next[index] = char
    onChange(next)
    if (char && index < 3) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        const next = [...value]
        next[index - 1] = ''
        onChange(next)
        inputRefs.current[index - 1]?.focus()
      } else {
        const next = [...value]
        next[index] = ''
        onChange(next)
      }
    }
  }

  return (
    <div className={cn('flex gap-2.5 justify-center', error && 'animate-shake')}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-11 rounded-xl text-center text-lg font-bold outline-none transition-all duration-200"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--text)',
            border: digit
              ? error ? '2px solid var(--red)' : '2px solid var(--gold)'
              : '2px solid var(--glass-border)',
            boxShadow: digit && !error ? '0 4px 16px rgba(179,135,42,.15)' : 'none',
          }}
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  )
}

/* ─── Main component ─── */

export function MultiPayModal({ isOpen, onClose, onSuccess }: MultiPayModalProps) {
  /* ── State ── */
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSearching, setStudentSearching] = useState(false)

  const [classes, setClasses] = useState<Class[]>([])
  const [classesLoading, setClassesLoading] = useState(false)

  const [items, setItems] = useState<LineItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [pin, setPin] = useState<string[]>(['', '', '', ''])
  const [pinError, setPinError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Fetch classes when modal opens ── */
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    async function load() {
      setClassesLoading(true)
      try {
        const { data } = await api.get('/classes')
        if (!cancelled) setClasses(data.classes ?? data ?? [])
      } catch {
        if (!cancelled) setClasses([])
      } finally {
        if (!cancelled) setClassesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen])

  /* ── Reset on close ── */
  useEffect(() => {
    if (!isOpen) {
      setStudentQuery('')
      setStudentResults([])
      setSelectedStudent(null)
      setItems([])
      setPaymentMethod('CASH')
      setPin(['', '', '', ''])
      setPinError(false)
      setSubmitting(false)
      setSubmitError(null)
    }
  }, [isOpen])

  /* ── Student search (debounced) ── */
  const handleStudentSearch = useCallback((query: string) => {
    setStudentQuery(query)
    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (query.length < 2) {
      setStudentResults([])
      return
    }

    setStudentSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/students', { params: { q: query } })
        setStudentResults(data.students ?? data ?? [])
      } catch {
        setStudentResults([])
      } finally {
        setStudentSearching(false)
      }
    }, 300)
  }, [])

  /* ── Line items ── */
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), group_id: '', group_name: '', amount_da: 0 },
    ])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        if (field === 'group_id') {
          const cls = classes.find((c) => c.id === value)
          return { ...it, group_id: value as string, group_name: cls?.name ?? '' }
        }
        return { ...it, [field]: value }
      }),
    )
  }

  const totalReceived = items.reduce((sum, it) => sum + (it.amount_da || 0), 0)

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!selectedStudent) return
    if (items.length === 0) return
    if (items.some((it) => !it.group_id || it.amount_da <= 0)) return
    if (pin.some((d) => !d)) {
      setPinError(true)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setPinError(false)

    try {
      await api.post('/billing/subscriptions/pay', {
        student_id: selectedStudent.id,
        items: items.map((it) => ({ group_id: it.group_id, amount: it.amount_da })),
        total_received: totalReceived,
        payment_method: paymentMethod,
        pin: pin.join(''),
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.message ||
        'Payment failed'
      // Check if it's a PIN error
      if (msg.toLowerCase().includes('pin')) {
        setPinError(true)
        setPin(['', '', '', ''])
      } else {
        setSubmitError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Can submit? ── */
  const canSubmit =
    selectedStudent &&
    items.length > 0 &&
    items.every((it) => it.group_id && it.amount_da > 0) &&
    pin.every((d) => d) &&
    !submitting

  /* ── Render ── */
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Multi-Teacher Payment"
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {/* ── Step 1: Select student ── */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2">
            1. Select Student
          </label>
          {selectedStudent ? (
            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--input-bg)] border border-[var(--glass-border)]">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[var(--text)]">
                  {selectedStudent.full_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null)
                  setStudentQuery('')
                  setStudentResults([])
                }}
                className="text-xs text-[var(--red)] hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search student by name…"
                value={studentQuery}
                onChange={(e) => handleStudentSearch(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2.5 rounded-[var(--radius-sm)]',
                  'text-sm text-[var(--text)] placeholder:text-[var(--muted)]/50',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  'outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30',
                  'transition-colors',
                )}
              />
              {studentSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {/* Dropdown */}
              {studentResults.length > 0 && (
                <div
                  className={cn(
                    'absolute z-20 mt-1 w-full max-h-48 overflow-y-auto',
                    'rounded-[var(--radius-sm)]',
                    'bg-[var(--glass)] backdrop-blur-[22px]',
                    'border border-[var(--glass-border)]',
                    'shadow-lg',
                  )}
                >
                  {studentResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(s)
                        setStudentQuery('')
                        setStudentResults([])
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2.5 text-sm',
                        'hover:bg-[var(--glass-strong)] transition-colors',
                        'border-b border-[var(--glass-border)]/30 last:border-b-0',
                      )}
                    >
                      <span className="text-[var(--text)]">{s.full_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 2: Line items ── */}
        {selectedStudent && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                2. Payment Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)]',
                  'text-xs font-medium',
                  'bg-[var(--gold-soft)] text-[var(--gold)]',
                  'hover:bg-[var(--gold)] hover:text-white',
                  'transition-colors duration-150',
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-[var(--muted)]/60 py-4 text-center border border-dashed border-[var(--glass-border)] rounded-[var(--radius-sm)]">
                Click "Add" to add a payment line
              </p>
            )}

            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2"
                >
                  {/* Group selector */}
                  <select
                    value={item.group_id}
                    onChange={(e) => updateItem(item.id, 'group_id', e.target.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm',
                      'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                      'text-[var(--text)] outline-none',
                      'focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30',
                      'transition-colors',
                      !item.group_id && 'text-[var(--muted)]',
                    )}
                  >
                    <option value="">Select group…</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.subject ? `(${cls.subject})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Amount */}
                  <div className="relative w-32">
                    <input
                      type="number"
                      min={0}
                      placeholder="Amount"
                      value={item.amount_da || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'amount_da', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className={cn(
                        'w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm tabular-nums',
                        'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                        'text-[var(--text)] outline-none placeholder:text-[var(--muted)]/50',
                        'focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30',
                        'transition-colors',
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none">
                      DA
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={cn(
                      'shrink-0 flex items-center justify-center',
                      'w-8 h-8 rounded-full',
                      'text-[var(--red)]/60 hover:text-[var(--red)] hover:bg-[var(--red-soft)]',
                      'transition-colors duration-150',
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            {items.length > 0 && (
              <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--input-bg)] border border-[var(--glass-border)]">
                <span className="text-xs font-medium text-[var(--muted)] uppercase">Total</span>
                <span className="text-base font-bold text-[var(--gold)] tabular-nums font-[family-name:var(--font-heading)]">
                  {formatCurrency(totalReceived)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Payment method ── */}
        {selectedStudent && items.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2">
              3. Payment Method
            </label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaymentMethod(key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)]',
                    'text-sm font-medium border transition-all duration-150',
                    paymentMethod === key
                      ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)] shadow-sm'
                      : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--glass-border)]',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: PIN ── */}
        {selectedStudent && items.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-3">
              4. PIN Verification
            </label>
            <PinInput value={pin} onChange={setPin} error={pinError} />
          </div>
        )}

        {/* ── Submit error ── */}
        {submitError && (
          <p className="text-xs font-medium text-[var(--red)] text-center">{submitError}</p>
        )}

        {/* ── Footer submit ── */}
        {selectedStudent && items.length > 0 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-sm)]',
              'text-sm font-semibold',
              'transition-all duration-200',
              canSubmit
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark, #9a7520)] text-white shadow-[0_4px_20px_rgba(179,135,42,.35)] hover:shadow-[0_6px_28px_rgba(179,135,42,.5)]'
                : 'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)] cursor-not-allowed',
            )}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {submitting ? 'Processing…' : `Pay ${formatCurrency(totalReceived)}`}
          </button>
        )}
      </div>
    </Modal>
  )
}

export default MultiPayModal
