import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { AlertTriangle, Trash2 } from 'lucide-react'

/* ─── Component ─── */

export function DangerZone() {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const canDelete = confirmText === 'DELETE'

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Reset data */}
      <Card>
        <CardHeader title="Reset All Data" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Remove all students, teachers, classes, and billing records. This cannot be undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Reset Academy Data
          </Button>
        </CardBody>
      </Card>

      {/* Delete academy */}
      <Card>
        <CardHeader title="Delete Academy" />
        <CardBody>
          <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--red-soft)] border border-[var(--red)]/20 mb-3">
            <AlertTriangle className="w-5 h-5 text-[var(--red)] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--red)]">This action is irreversible</span>
              <span className="text-xs text-[var(--muted)]">
                Deleting your academy will permanently remove all data including student records, billing history, and staff accounts.
              </span>
            </div>
          </div>
          <Button variant="danger" size="sm">
            Delete Academy
          </Button>
        </CardBody>
      </Card>

      {/* Confirm delete modal */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setConfirmText('') }} title="Reset Academy Data" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--muted)]">
            This will permanently delete all data. Type <span className="font-mono font-semibold text-[var(--red)]">DELETE</span> to confirm.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm text-[var(--text)]',
              'bg-[var(--input-bg)] border border-[var(--glass-border)]',
              'outline-none focus:ring-2 focus:ring-[var(--red)]/30',
              'placeholder:text-[var(--muted)]/50',
            )}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => { setDeleteOpen(false); setConfirmText('') }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!canDelete}
              onClick={() => {
                // TODO: API call to reset data
                setDeleteOpen(false)
                setConfirmText('')
              }}
            >
              Reset Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DangerZone
