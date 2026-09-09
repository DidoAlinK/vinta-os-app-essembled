import { useState, useEffect } from 'react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { formatCurrency, formatNumber } from '../../lib/formatters'
import type { BillingStats, RevenueDataPoint, BillingRingData } from '../../types/billing'
import { Card, CardBody } from '../../components/ui/Card'
import DonutCards from './DonutCards'
import RevenueChart from './RevenueChart'
import FinanceBreakdown from './FinanceBreakdown'
import {
  TrendingUp,
  Users,
  Receipt,
} from 'lucide-react'

/* ─── Component ─── */

export function BillingPage() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [revenueProperty, setRevenueProperty] = useState('income')
  const [isLoading, setIsLoading] = useState(true)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [breakdownType, setBreakdownType] = useState<'students' | 'teachers'>('students')

  /* ── Fetch stats ── */
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const [statsRes, revenueRes] = await Promise.all([
          api.get('/billing/stats'),
          api.get('/billing/revenue', { params: { property: revenueProperty } }),
        ])
        if (!cancelled) {
          setStats(statsRes.data)
          setRevenueData(revenueRes.data.revenue ?? revenueRes.data ?? [])
        }
      } catch {
        // Backend unavailable
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  /* ── Fetch revenue on property change ── */
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data } = await api.get('/billing/revenue', {
          params: { property: revenueProperty },
        })
        if (!cancelled) setRevenueData(data.revenue ?? data ?? [])
      } catch {
        // Backend unavailable
      }
    }

    load()
    return () => { cancelled = true }
  }, [revenueProperty])

  /* ── Derived data ── */
  const studentRing: BillingRingData[] = stats
    ? [
        { name: 'Paid', value: stats.student_paid, color: 'var(--emerald)' },
        { name: 'Due', value: stats.student_due, color: 'var(--gold)' },
        { name: 'Overdue', value: stats.student_overdue, color: 'var(--red)' },
      ]
    : []

  const teacherRing: BillingRingData[] = stats
    ? [
        { name: 'Settled', value: stats.teacher_settled, color: 'var(--emerald)' },
        { name: 'Pending', value: stats.teacher_pending, color: 'var(--gold)' },
        { name: 'Overdue', value: stats.teacher_overdue, color: 'var(--red)' },
      ]
    : []

  /* ── Handlers ── */
  const handleOpenBreakdown = (type: 'students' | 'teachers') => {
    setBreakdownType(type)
    setBreakdownOpen(true)
  }

  /* ── Render ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-[var(--muted)]">
          <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading billing data…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 h-full overflow-y-auto">
      {/* ── Donut ring cards ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="cursor-pointer hover:scale-[1.01] transition-transform"
          onClick={() => handleOpenBreakdown('students')}
        >
          <DonutCards
            title="Student Tuition"
            data={studentRing}
            centerLabel="Total"
            centerValue={formatNumber(stats?.student_total ?? 0)}
          />
        </div>
        <div
          className="cursor-pointer hover:scale-[1.01] transition-transform"
          onClick={() => handleOpenBreakdown('teachers')}
        >
          <DonutCards
            title="Teacher Payroll"
            data={teacherRing}
            centerLabel="Total"
            centerValue={formatNumber(stats?.teacher_total ?? 0)}
          />
        </div>
      </div>

      {/* ── Revenue chart ─────────────────────── */}
      <RevenueChart
        data={revenueData}
        property={revenueProperty}
        onPropertyChange={setRevenueProperty}
      />

      {/* ── Stat buttons + breakdown ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* This month's income */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] shrink-0"
                style={{ backgroundColor: 'var(--emerald-soft)', color: 'var(--emerald)' }}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-[var(--muted)] font-medium">This month's income</span>
                <span className="text-lg font-bold text-[var(--text)] font-[family-name:var(--font-heading)] tabular-nums">
                  {formatCurrency(stats?.month_income ?? 0)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total enrolled */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] shrink-0"
                style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)' }}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-[var(--muted)] font-medium">Total enrolled</span>
                <span className="text-lg font-bold text-[var(--text)] font-[family-name:var(--font-heading)] tabular-nums">
                  {formatNumber(stats?.total_enrolled ?? 0)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Finance breakdown button */}
        <button
          type="button"
          onClick={() => handleOpenBreakdown('students')}
          className={cn(
            'flex items-center gap-3 p-4 rounded-[var(--radius-md)] text-left',
            'bg-[var(--glass)] backdrop-blur-[22px]',
            'border border-[var(--glass-border)]',
            'hover:bg-[var(--glass-strong)] hover:scale-[1.01]',
            'transition-all duration-200',
          )}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] shrink-0"
            style={{ backgroundColor: 'var(--red-soft)', color: 'var(--red)' }}
          >
            <Receipt className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-[var(--muted)] font-medium">Finance breakdown</span>
            <span className="text-sm font-semibold text-[var(--text)] font-[family-name:var(--font-heading)]">
              View details →
            </span>
          </div>
        </button>
      </div>

      {/* ── Finance breakdown modal ────────────── */}
      <FinanceBreakdown
        isOpen={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        type={breakdownType}
      />
    </div>
  )
}

export default BillingPage
