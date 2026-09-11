import { useState, useEffect } from 'react'
import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { AcademySettings } from '../../types/settings'
import { Save, Plus, X, Trash2, Coins, Clock, Users } from 'lucide-react'

/* ─── Props ─── */

export interface BillingConfigProps {
  settings: AcademySettings
  onUpdate: (data: Partial<AcademySettings>) => void
}

/* ─── Types ─── */

interface BillingPreset {
  id: string
  label: string
  days: number
}

/* ─── Constants ─── */

const PRESETS_STORAGE_KEY = 'vinta_billing_presets'

const DEFAULT_PRESETS: BillingPreset[] = [
  { id: 'default-1m', label: '1 Month', days: 30 },
  { id: 'default-3m', label: '3 Months', days: 90 },
  { id: 'default-6m', label: '6 Months', days: 180 },
]

const CURRENCY_OPTIONS = [
  { value: 'DZD', label: 'DZD (د.ج)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
]

const REMINDER_PRESETS = [1, 2, 3, 5, 7]

/* ─── Helpers ─── */

function loadPresets(): BillingPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // corrupt storage
  }
  // First load → seed defaults
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS))
  return DEFAULT_PRESETS
}

function savePresets(presets: BillingPreset[]) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
}

/* ─── Component ─── */

export function BillingConfig({ settings, onUpdate }: BillingConfigProps) {
  const [form, setForm] = useState({
    currency: settings.currency,
    default_plan_duration: settings.default_plan_duration,
    billing_reminder_days_before: settings.billing_reminder_days_before,
    whatsapp_template: settings.whatsapp_template,
    // New money model defaults
    default_credits_per_cycle: (settings as any).default_credits_per_cycle ?? 4,
    allow_rollover_default: (settings as any).allow_rollover_default ?? false,
    allow_makeups_default: (settings as any).allow_makeups_default ?? true,
    default_access_weeks: (settings as any).default_access_weeks ?? null,
    default_max_groups: (settings as any).default_max_groups ?? 1,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Preset system
  const [presets, setPresets] = useState<BillingPreset[]>(loadPresets)
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [newPresetLabel, setNewPresetLabel] = useState('')
  const [newPresetDays, setNewPresetDays] = useState('')

  // Persist presets whenever they change (but not on first render)
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (initialized) {
      savePresets(presets)
    } else {
      setInitialized(true)
    }
  }, [presets, initialized])

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleAddPreset = () => {
    const days = parseInt(newPresetDays, 10)
    const label = newPresetLabel.trim()
    if (!days || days <= 0 || !label) return

    const newPreset: BillingPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      days,
    }

    setPresets((prev) => [...prev, newPreset])
    setForm((prev) => ({ ...prev, default_plan_duration: days }))
    setNewPresetLabel('')
    setNewPresetDays('')
    setShowAddPreset(false)
    setSaved(false)
  }

  const handleRemovePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Currency */}
      <Card>
        <CardHeader title="Currency" />
        <CardBody>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text)] font-[family-name:var(--font-heading)]">
              Default Currency
            </label>
            <div className="flex gap-2 flex-wrap">
              {CURRENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('currency', opt.value)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                    'border transition-all duration-200',
                    form.currency === opt.value
                      ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                      : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Money Model Defaults */}
      <Card>
        <CardHeader title="Money Model Defaults" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-4">
            Default values applied to new Course Groups. You can override per-group.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Credits per cycle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1.5">
                <Coins size={12} />
                Credits per Cycle
              </label>
              <input
                type="number"
                value={form.default_credits_per_cycle}
                onChange={(e) => handleChange('default_credits_per_cycle', Number(e.target.value))}
                min={1}
                className={cn(inputCls)}
              />
              <span className="text-[10px] text-[var(--muted)]">For CREDIT_BASED groups</span>
            </div>

            {/* Max groups included */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1.5">
                <Users size={12} />
                Max Groups per Subscription
              </label>
              <input
                type="number"
                value={form.default_max_groups}
                onChange={(e) => handleChange('default_max_groups', Number(e.target.value))}
                min={1}
                max={10}
                className={cn(inputCls)}
              />
            </div>

            {/* Default access weeks */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1.5">
                <Clock size={12} />
                Access Duration (weeks)
              </label>
              <input
                type="number"
                value={form.default_access_weeks ?? ''}
                onChange={(e) => handleChange('default_access_weeks', e.target.value ? Number(e.target.value) : null)}
                min={1}
                placeholder="Not set"
                className={cn(inputCls)}
              />
              <span className="text-[10px] text-[var(--muted)]">For TIME_BASED groups</span>
            </div>

            {/* Allow Rollover */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">Credit Rollover</label>
              <button
                type="button"
                onClick={() => handleChange('allow_rollover_default', !form.allow_rollover_default)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
                  'border transition-all duration-150 text-left',
                  form.allow_rollover_default
                    ? 'bg-[var(--emerald-soft)] border-[var(--emerald)]/30 text-[var(--emerald)]'
                    : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)]',
                )}
              >
                <span className={cn(
                  'w-8 h-4 rounded-full relative transition-colors duration-200',
                  form.allow_rollover_default ? 'bg-[var(--emerald)]' : 'bg-[var(--muted)]/30',
                )}>
                  <span className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200',
                    form.allow_rollover_default ? 'left-4.5' : 'left-0.5',
                  )} />
                </span>
                {form.allow_rollover_default ? 'On' : 'Off'}
              </button>
            </div>

            {/* Allow Makeups */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">Makeup Sessions</label>
              <button
                type="button"
                onClick={() => handleChange('allow_makeups_default', !form.allow_makeups_default)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
                  'border transition-all duration-150 text-left',
                  form.allow_makeups_default
                    ? 'bg-[var(--emerald-soft)] border-[var(--emerald)]/30 text-[var(--emerald)]'
                    : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)]',
                )}
              >
                <span className={cn(
                  'w-8 h-4 rounded-full relative transition-colors duration-200',
                  form.allow_makeups_default ? 'bg-[var(--emerald)]' : 'bg-[var(--muted)]/30',
                )}>
                  <span className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200',
                    form.allow_makeups_default ? 'left-4.5' : 'left-0.5',
                  )} />
                </span>
                {form.allow_makeups_default ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Plan Duration — Preset System */}
      <Card>
        <CardHeader title="Plan Duration" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Default billing cycle for new student enrollments.
          </p>

          {/* Preset grid */}
          <div className="flex gap-2 flex-wrap mb-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  'group relative flex items-center gap-1.5',
                  'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                  'border transition-all duration-200',
                  form.default_plan_duration === preset.days
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                    : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => handleChange('default_plan_duration', preset.days)}
                  className="flex-1 text-left"
                >
                  {preset.label} <span className="opacity-50 text-xs">({preset.days}d)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePreset(preset.id)}
                  className={cn(
                    'shrink-0 p-0.5 rounded',
                    'opacity-0 group-hover:opacity-100',
                    'hover:bg-[var(--red-soft)] text-[var(--muted)] hover:text-[var(--red)]',
                    'transition-all duration-150',
                  )}
                  aria-label={`Remove ${preset.label}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Create Preset */}
          {!showAddPreset ? (
            <button
              type="button"
              onClick={() => setShowAddPreset(true)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                'border border-dashed border-[var(--muted)]/30',
                'text-[var(--muted)] hover:text-[var(--text)]',
                'hover:border-[var(--muted)]/60 hover:bg-[var(--input-bg)]',
                'transition-all duration-200',
              )}
            >
              <Plus size={14} className="inline mr-1" />
              Create a Preset
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPresetLabel}
                onChange={(e) => setNewPresetLabel(e.target.value)}
                placeholder="Label (e.g. 4 Months)"
                className={cn(
                  'px-3 py-1.5 text-sm rounded-[var(--radius-xs)]',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  'text-[var(--text)] placeholder:text-[var(--muted)]/50',
                  'outline-none focus:ring-1 focus:ring-[var(--gold)]/30',
                  'w-36',
                )}
              />
              <input
                type="number"
                value={newPresetDays}
                onChange={(e) => setNewPresetDays(e.target.value)}
                placeholder="Days"
                min={1}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-[var(--radius-xs)]',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                  'text-[var(--text)] placeholder:text-[var(--muted)]/50',
                  'outline-none focus:ring-1 focus:ring-[var(--gold)]/30',
                  'w-20',
                )}
              />
              <button
                type="button"
                onClick={handleAddPreset}
                disabled={!newPresetLabel.trim() || !newPresetDays}
                className={cn(
                  'px-2.5 py-1.5 text-sm font-medium rounded-[var(--radius-xs)]',
                  'bg-[var(--gold)] text-white',
                  'hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                )}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddPreset(false)
                  setNewPresetLabel('')
                  setNewPresetDays('')
                }}
                className="p-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--input-bg)] text-[var(--muted)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Reminder Days */}
      <Card>
        <CardHeader title="Reminder Days" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Days before due date to send a payment reminder.
          </p>
          <div className="flex gap-2 flex-wrap">
            {REMINDER_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handleChange('billing_reminder_days_before', days)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                  'border transition-all duration-200',
                  form.billing_reminder_days_before === days
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                    : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]',
                )}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* WhatsApp Template */}
      <Card>
        <CardHeader title="WhatsApp Template" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Custom message template for payment reminders sent via WhatsApp.
            {'{{name}}'} = student name, {'{{amount}}'} = amount, {'{{date}}'} = due date.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <textarea
                value={form.whatsapp_template}
                onChange={(e) => handleChange('whatsapp_template', e.target.value)}
                rows={5}
                className={cn(
                  'w-full px-4 py-3 text-sm rounded-[var(--radius-sm)]',
                  'bg-[var(--input-bg)] backdrop-blur-sm',
                  'border border-[var(--glass-border)]',
                  'text-[var(--text)] placeholder:text-[var(--muted)]',
                  'font-[family-name:var(--font-body)]',
                  'resize-none',
                  'transition-shadow duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--gold-soft)] focus:border-[var(--gold)]',
                )}
                placeholder="Bonjour {{name}}, votre paiement de {{amount}} est dû le {{date}}. Merci de régulariser."
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          loading={isSaving}
          variant="primary"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
        {saved && (
          <span className="text-sm text-[var(--emerald)] font-medium animate-fade-in">
            Saved ✓
          </span>
        )}
      </div>
    </div>
  )
}

const inputCls = cn(
  'w-full px-3 py-2 rounded-xl text-sm text-[var(--text)]',
  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
  'placeholder:text-[var(--muted)]/50',
  'transition-shadow duration-150',
)

export default BillingConfig
