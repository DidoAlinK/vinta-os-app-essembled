import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '../../lib/cn'

/* ─── Props ─── */

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Whether dark mode is active */
  checked?: boolean
  /** Called when the user taps the toggle */
  onCheckedChange?: (checked: boolean) => void
}

/* ─── Component ─── */

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onCheckedChange, className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center',
          'w-[60px] h-[30px] rounded-full p-[5px]',
          'transition-colors duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked
            ? 'bg-[var(--glass-strong)] border border-[var(--glass-border)]'
            : 'bg-[var(--input-bg)] border border-[var(--glass-border)]',
          className,
        )}
        {...rest}
      >
        {/* Track icons */}
        <Sun
          className={cn(
            'absolute left-[7px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] transition-opacity duration-300',
            checked ? 'opacity-40 text-[var(--muted)]' : 'opacity-90 text-[var(--gold)]',
          )}
        />
        <Moon
          className={cn(
            'absolute right-[7px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] transition-opacity duration-300',
            checked ? 'opacity-90 text-[var(--gold)]' : 'opacity-40 text-[var(--muted)]',
          )}
        />

        {/* Knob */}
        <span
          aria-hidden="true"
          className={cn(
            'block w-[20px] h-[20px] rounded-full',
            'bg-gradient-to-r from-[var(--gold)] to-[var(--emerald)]',
            'shadow-[0_2px_8px_rgba(0,0,0,.18)]',
            'transition-transform duration-300',
            checked ? 'translate-x-[30px]' : 'translate-x-0',
          )}
          style={{
            transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          }}
        />
      </button>
    )
  },
)

Toggle.displayName = 'Toggle'

export default Toggle
