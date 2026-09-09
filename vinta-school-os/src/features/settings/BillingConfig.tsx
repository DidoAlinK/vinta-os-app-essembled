import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { AcademySettings } from '../../types/settings'
import { Save } from 'lucide-react'

/* ─── Props ─── */

export interface BillingConfigProps {
  settings: AcademySettings
  onUpdate: (data: Partial<AcademySettings>) => void
}

/* ─── Duration presets ─── */

const DURATION_PRESETS = [
  { value: 30, label: '1 Month' },
  { value: 60, label: '2 Months' },
  { value: 90, label: '3 Months' },
  { value: 180, label: '6 Months' },
]

const CURRENCY_OPTIONS = [
  { value: 'DZD', label: 'DZD (د.ج)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
]

const REMINDER_PRESETS = [1, 2, 3, 5, 7]

/* ─── Component ─── */

export function BillingConfig({ settings, onUpdate }: BillingConfigProps) {
  const [form, setForm] = useState({
    currency: settings.currency,
    default_plan_duration: settings.default_plan_duration,
    billing_reminder_days_before: settings.billing_reminder_days_before,
    whatsapp_template: settings.whatsapp_template,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
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

      {/* Plan Duration */}
      <Card>
        <CardHeader title="Plan Duration" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Default billing cycle for new student enrollments.
          </p>
          <div className="flex gap-2 flex-wrap">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleChange('default_plan_duration', preset.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                  'border transition-all duration-200',
                  form.default_plan_duration === preset.value
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                    : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
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

export default BillingConfig
