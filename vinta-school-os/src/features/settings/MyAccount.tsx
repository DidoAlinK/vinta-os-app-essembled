import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Save, User } from 'lucide-react'

/* ─── Component ─── */

export function MyAccount() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: API call to update account
      await new Promise((r) => setTimeout(r, 500))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Profile card */}
      <Card>
        <CardHeader
          title="My Account"
          actions={<User className="w-4 h-4 text-[var(--muted)]" />}
        />
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+213 5## ## ## ##"
            />
          </div>
        </CardBody>
      </Card>

      {/* Change PIN */}
      <Card>
        <CardHeader title="Change PIN" />
        <CardBody>
          <p className="text-sm text-[var(--muted)] mb-3">
            Update your 4-digit PIN used for login.
          </p>
          <div className="flex gap-3">
            <Input
              label="Current PIN"
              type="password"
              placeholder="••••"
              maxLength={4}
            />
            <Input
              label="New PIN"
              type="password"
              placeholder="••••"
              maxLength={4}
            />
          </div>
        </CardBody>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={isSaving} variant="primary">
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

export default MyAccount
