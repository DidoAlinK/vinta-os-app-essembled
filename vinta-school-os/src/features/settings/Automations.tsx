import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Toggle } from '../../components/ui/Toggle'
import { Zap } from 'lucide-react'

/* ─── Component ─── */

export function Automations() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Auto checkout */}
      <Card>
        <CardHeader
          title="Auto Checkout"
          actions={<Zap className="w-4 h-4 text-[var(--muted)]" />}
        />
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[var(--text)]">
                Enable automatic checkout
              </span>
              <span className="text-xs text-[var(--muted)]">
                Students are automatically checked out when the session ends
              </span>
            </div>
            <Toggle checked={false} onCheckedChange={() => {}} />
          </div>
        </CardBody>
      </Card>

      {/* End class popup */}
      <Card>
        <CardHeader title="End Class Popup" />
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[var(--text)]">
                Show end-of-class popup
              </span>
              <span className="text-xs text-[var(--muted)]">
                Display attendance summary when a session ends
              </span>
            </div>
            <Toggle checked={false} onCheckedChange={() => {}} />
          </div>
        </CardBody>
      </Card>

      {/* Pro features hint */}
      <Card>
        <CardBody>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--gold-soft)] flex items-center justify-center">
              <Zap className="w-6 h-6 text-[var(--gold)]" />
            </div>
            <p className="text-sm text-[var(--muted)]">
              More automations available on the <span className="font-semibold text-[var(--gold)]">Pro</span> plan.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default Automations
