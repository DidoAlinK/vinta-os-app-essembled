/**
 * Vinta School OS — Student Drawer
 * Slide-in panel from the right showing student details,
 * guardians, payment plan, and contact actions.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  Phone,
  MessageCircle,
  User,
  Shield,
  BookOpen,
  CreditCard,
  Plus,
  Tag,
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
// Payment Preset type
// ============================================

interface PaymentPreset {
  id: string
  name: string
  amount: number
}

// ============================================
// Component
// ============================================

export default function StudentDrawer({ student, isOpen, onClose }: StudentDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Payment plan state
  const [paymentPresets, setPaymentPresets] = useState<PaymentPreset[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)

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

          {/* Payment Plan */}
          <Section
            icon={<CreditCard size={14} />}
            title="Payment Plan"
          >
            <div className="space-y-3">
              {/* Existing presets */}
              {paymentPresets.length > 0 && (
                <div className="space-y-1.5">
                  {paymentPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg',
                        'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-[var(--gold)]" />
                        <span className="text-sm font-medium text-[var(--text)]">{preset.name}</span>
                      </div>
                      <span className="text-sm text-[var(--muted)]">{formatCurrency(preset.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Blank space / empty state */}
              {paymentPresets.length === 0 && (
                <p className="text-xs text-[var(--muted)] italic">
                  No payment plans yet. Add a custom payment or create a preset.
                </p>
              )}

              {/* Add Payment button */}
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
                  'text-sm font-medium',
                  'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/20',
                  'hover:bg-[var(--gold)]/20 active:scale-[0.98]',
                  'transition-all duration-150',
                )}
              >
                <Plus size={14} />
                Add Payment
              </button>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          presets={paymentPresets}
          onAddPreset={(preset) => setPaymentPresets((prev) => [...prev, preset])}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
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
// Payment Modal (internal)
// ============================================

function PaymentModal({
  presets,
  onAddPreset,
  onClose,
}: {
  presets: PaymentPreset[]
  onAddPreset: (preset: PaymentPreset) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'choose' | 'custom' | 'preset'>('choose')
  const [customAmount, setCustomAmount] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetAmount, setPresetAmount] = useState('')

  const handleAddCustom = () => {
    if (!customAmount) return
    // Just close — custom payment added
    onClose()
  }

  const handleAddPreset = () => {
    if (!presetName.trim() || !presetAmount) return
    onAddPreset({
      id: Date.now().toString(),
      name: presetName.trim(),
      amount: Number(presetAmount),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(10,10,10,.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={cn(
          'w-full max-w-sm mx-4 p-5 rounded-2xl',
          'bg-[var(--card-bg)] border border-[var(--glass-border)]',
          'shadow-2xl animate-fade-in',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Add Payment
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--muted)] hover:bg-[var(--glass)]">
            <X size={14} />
          </button>
        </div>

        {/* Choose mode */}
        {mode === 'choose' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                'hover:border-[var(--gold)]/30 transition-all text-left',
              )}
            >
              <CreditCard size={16} className="text-[var(--gold)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Custom Payment</p>
                <p className="text-xs text-[var(--muted)]">One-time payment with custom amount</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                'hover:border-[var(--emerald)]/30 transition-all text-left',
              )}
            >
              <Tag size={16} className="text-[var(--emerald)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Create Preset</p>
                <p className="text-xs text-[var(--muted)]">Save a reusable payment plan</p>
              </div>
            </button>
          </div>
        )}

        {/* Custom payment */}
        {mode === 'custom' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Amount (DA)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 3500"
                className={cn(
                  'w-full px-3 py-2 rounded-xl text-sm text-[var(--text)]',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                )}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customAmount}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#b3872a] to-[#0f6b4d] disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Create preset */}
        {mode === 'preset' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Preset Name</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. Monthly Plan"
                className={cn(
                  'w-full px-3 py-2 rounded-xl text-sm text-[var(--text)]',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                )}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Amount (DA)</label>
              <input
                type="number"
                value={presetAmount}
                onChange={(e) => setPresetAmount(e.target.value)}
                placeholder="e.g. 3500"
                className={cn(
                  'w-full px-3 py-2 rounded-xl text-sm text-[var(--text)]',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
                )}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAddPreset}
                disabled={!presetName.trim() || !presetAmount}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#b3872a] to-[#0f6b4d] disabled:opacity-40"
              >
                Save Preset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
