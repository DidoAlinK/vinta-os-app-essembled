import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Toggle } from '../../components/ui/Toggle'
import { Sun, Moon, Type, Globe } from 'lucide-react'
import type { AcademySettings } from '../../types/settings'

/* ─── Props ─── */

export interface AppearanceProps {
  settings: AcademySettings
  onUpdate: (data: Partial<AcademySettings>) => void
}

/* ─── Option chip ─── */

function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-[var(--radius-xs)]',
        'border transition-all duration-200',
        selected
          ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
          : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--glass-strong)]',
      )}
    >
      {label}
    </button>
  )
}

/* ─── Component ─── */

export function Appearance({ settings, onUpdate }: AppearanceProps) {
  const isDark = settings.default_theme === 'dark'
  const isLarge = settings.default_font_size === 'large'
  const isArabic = settings.default_language === 'ar'

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Theme */}
      <Card>
        <CardHeader
          title="Theme"
          actions={
            <div className="flex items-center gap-2">
              <Sun className={cn('w-4 h-4', !isDark && 'text-[var(--gold)]')} />
              <Toggle
                checked={isDark}
                onCheckedChange={(checked) =>
                  onUpdate({ default_theme: checked ? 'dark' : 'light' })
                }
              />
              <Moon className={cn('w-4 h-4', isDark && 'text-[var(--gold)]')} />
            </div>
          }
        />
        <CardBody>
          <p className="text-sm text-[var(--muted)]">
            {isDark ? 'Dark mode is active — easy on the eyes.' : 'Light mode is active — clean and bright.'}
          </p>
        </CardBody>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader title="Font Size" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Adjust the text size for comfortable reading.
          </p>
          <div className="flex gap-2">
            <OptionChip
              label="Normal"
              selected={!isLarge}
              onClick={() => onUpdate({ default_font_size: 'normal' })}
            />
            <OptionChip
              label="Large"
              selected={isLarge}
              onClick={() => onUpdate({ default_font_size: 'large' })}
            />
          </div>
        </CardBody>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader
          title="Language"
          actions={<Globe className="w-4 h-4 text-[var(--muted)]" />}
        />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Interface language for labels and navigation.
          </p>
          <div className="flex gap-2">
            <OptionChip
              label="Français"
              selected={!isArabic}
              onClick={() => onUpdate({ default_language: 'fr' })}
            />
            <OptionChip
              label="العربية"
              selected={isArabic}
              onClick={() => onUpdate({ default_language: 'ar' })}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default Appearance
