import { useState, useEffect } from 'react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { formatCurrency, formatDateShort } from '../../lib/formatters'
import { Badge } from '../../components/ui/Badge'
import type { Subscription } from '../../types/billing'
import { CreditCard, CalendarClock, Inbox } from 'lucide-react'

/* ─── Props ─── */

interface SubscriptionsPanelProps {
  className?: string
}

/* ─── Billing-model badge helpers ─── */

const BILLING_MODEL_STYLE: Record<string, { variant: 'warning' | 'info'; label: string }> = {
  CREDIT_BASED: { variant: 'warning', label: 'Credits' },
  TIME_BASED: { variant: 'info', label: 'Time' },
}

/* ─── Status badge helpers ─── */

const STATUS_STYLE: Record<string, { variant: 'success' | 'danger' | 'warning' | 'default'; label: string }> = {
  ACTIVE: { variant: 'success', label: 'Active' },
  EXPIRED: { variant: 'danger', label: 'Expired' },
  DEPLETED: { variant: 'danger', label: 'Depleted' },
  EXPIRING_SOON: { variant: 'warning', label: 'Expiring Soon' },
  RENEW_REQUIRED: { variant: 'warning', label: 'Renew Required' },
  ATTENDANCE_WARNING: { variant: 'warning', label: 'Attn Warning' },
}

/* ─── Component ─── */

export function SubscriptionsPanel({ className }: SubscriptionsPanelProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const { data } = await api.get('/billing/subscriptions')
        if (!cancelled) setSubscriptions(data.subscriptions ?? data ?? [])
      } catch {
        if (!cancelled) setSubscriptions([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-16', className)}>
        <div className="flex flex-col items-center gap-3 text-[var(--muted)]">
          <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading subscriptions…</span>
        </div>
      </div>
    )
  }

  /* ── Empty state ── */
  if (subscriptions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>
        <div className="w-16 h-16 rounded-full bg-[var(--input-bg)] flex items-center justify-center">
          <Inbox className="w-7 h-7 text-[var(--muted)]/40" />
        </div>
        <p className="text-sm font-medium text-[var(--muted)]">No subscriptions yet</p>
        <p className="text-xs text-[var(--muted)]/60">
          Student subscriptions will appear here once created.
        </p>
      </div>
    )
  }

  /* ── Table ── */
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--glass-border)]">
            <th className="text-left px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Student</th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Group</th>
            <th className="text-center px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Model</th>
            <th className="text-center px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Value</th>
            <th className="text-center px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Status</th>
            <th className="text-right px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Price</th>
            <th className="text-right px-3 py-2.5 text-xs font-medium text-[var(--muted)]">Created</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => {
            const modelStyle = BILLING_MODEL_STYLE[sub.billing_model] ?? BILLING_MODEL_STYLE.CREDIT_BASED
            const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE.ACTIVE

            return (
              <tr
                key={sub.id}
                className={cn(
                  'border-b border-[var(--glass-border)]/50',
                  'hover:bg-[var(--glass)] transition-colors',
                )}
              >
                {/* Student name */}
                <td className="px-3 py-3">
                  <span className="font-medium text-[var(--text)]">{sub.student_name}</span>
                </td>

                {/* Group name */}
                <td className="px-3 py-3">
                  <span className="text-[var(--text)]/80">{sub.group_name}</span>
                </td>

                {/* Billing model badge */}
                <td className="px-3 py-3 text-center">
                  <Badge variant={modelStyle.variant} size="sm">
                    <span className="inline-flex items-center gap-1">
                      {sub.billing_model === 'CREDIT_BASED'
                        ? <CreditCard className="w-3 h-3" />
                        : <CalendarClock className="w-3 h-3" />}
                      {modelStyle.label}
                    </span>
                  </Badge>
                </td>

                {/* Credits remaining / Access end date */}
                <td className="px-3 py-3 text-center">
                  {sub.billing_model === 'CREDIT_BASED' ? (
                    <span className="tabular-nums font-medium text-[var(--text)]">
                      {sub.remaining_credits ?? 0}
                      <span className="text-[var(--muted)] text-xs ml-0.5">
                        /{sub.total_credits ?? 0}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--text)]">
                      {sub.access_end_date ? formatDateShort(sub.access_end_date) : '—'}
                    </span>
                  )}
                </td>

                {/* Status badge */}
                <td className="px-3 py-3 text-center">
                  <Badge variant={statusStyle.variant} size="sm">
                    {statusStyle.label}
                  </Badge>
                </td>

                {/* Price */}
                <td className="px-3 py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {sub.amount_paid_da != null ? formatCurrency(sub.amount_paid_da) : '—'}
                </td>

                {/* Created */}
                <td className="px-3 py-3 text-right text-[var(--muted)]">
                  {sub.created_at ? formatDateShort(sub.created_at) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SubscriptionsPanel
