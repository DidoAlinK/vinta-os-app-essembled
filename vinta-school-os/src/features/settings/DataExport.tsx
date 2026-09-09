import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Download, FileText } from 'lucide-react'

/* ─── Component ─── */

export function DataExport() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Export options */}
      <Card>
        <CardHeader title="Export Data" actions={<Download className="w-4 h-4 text-[var(--muted)]" />} />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-4">
            Download your academy data as CSV files for backup or analysis.
          </p>
          <div className="flex flex-col gap-3">
            {['Students', 'Teachers', 'Classes', 'Billing Records', 'Activity Log'].map((item) => (
              <div
                key={item}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)]',
                  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--text)]">{item}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default DataExport
