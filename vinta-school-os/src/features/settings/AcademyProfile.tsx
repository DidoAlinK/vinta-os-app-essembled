import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Academy } from '../../types/settings'
import { Save } from 'lucide-react'

/* ─── Props ─── */

export interface AcademyProfileProps {
  academy: Academy
  onUpdate: (data: Partial<Academy>) => void
}

/* ─── Weekend options ─── */

const WEEKEND_DAYS = [
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

const TERM_OPTIONS = [
  'Term 1',
  'Term 2',
  'Full Year',
]

/* ─── Component ─── */

export function AcademyProfile({ academy, onUpdate }: AcademyProfileProps) {
  const [form, setForm] = useState({
    name: academy.name,
    phone: academy.phone,
    email: academy.email,
    address: academy.address,
    weekend_day: academy.weekend_day,
    current_term: academy.current_term,
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
      {/* Academy Info */}
      <Card>
        <CardHeader title="Academy Info" />
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Academy Name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Vinta Academy"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+213 5## ## ## ##"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@academy.dz"
              />
            </div>

            <Input
              label="Address"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street, City, Wilaya"
            />
          </div>
        </CardBody>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader title="Schedule" />
        <CardBody>
          <div className="flex flex-col gap-4">
            {/* Weekend Day */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text)] font-[family-name:var(--font-heading)]">
                Weekend Day
              </label>
              <div className="flex gap-2">
                {WEEKEND_DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleChange('weekend_day', day.value)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                      'border transition-all duration-200',
                      form.weekend_day === day.value
                        ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                        : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]',
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Term */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text)] font-[family-name:var(--font-heading)]">
                Current Term
              </label>
              <div className="flex gap-2">
                {TERM_OPTIONS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleChange('current_term', term)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
                      'border transition-all duration-200',
                      form.current_term === term
                        ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                        : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]',
                    )}
                  >
                    {term}
                  </button>
                ))}
              </div>
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

export default AcademyProfile
