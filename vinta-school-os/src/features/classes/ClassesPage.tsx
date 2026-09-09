/**
 * Vinta School OS — Classes Page
 * Main page for managing classes with grid view and class detail panel.
 */

import { useCallback, useState, useEffect } from 'react'
import { Plus, GraduationCap, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import { SUBJECT_COLORS } from '../../lib/constants'
import ClassGrid from './ClassGrid'
import ClassDetail from './ClassDetail'
import type { Class } from '../../types/class'
import type { Teacher } from '../../types/teacher'

/* ─── Stat chip ─── */
function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

/* ─── Color presets ─── */
const COLOR_PRESETS = [
  { color: '#b3872a', label: 'Math' },
  { color: '#7c3aed', label: 'French' },
  { color: '#0ea5e9', label: 'English' },
  { color: '#0f6b4d', label: 'Science' },
  { color: '#ea580c', label: 'History' },
  { color: '#10b981', label: 'PE' },
  { color: '#db2777', label: 'Art' },
  { color: '#6366f1', label: 'Music' },
]

const SUBJECT_OPTIONS = ['Math', 'French', 'English', 'Science', 'History', 'PE', 'Art', 'Music'] as const

/* ─── Add Class Modal ─── */
function AddClassModal({
  isOpen, onClose, onAdd,
}: {
  isOpen: boolean; onClose: () => void
  onAdd: (data: { name: string; subject: string; color: string; capacity: number; teacher_id?: string; notes?: string }) => void
}) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[0].color)
  const [capacity, setCapacity] = useState(20)
  const [teacherId, setTeacherId] = useState('')
  const [notes, setNotes] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])

  /* Fetch teachers for dropdown */
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    async function load() {
      try {
        const { data } = await api.get('/teachers')
        if (!cancelled) setTeachers(data.teachers ?? data ?? [])
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen])

  const resetAndClose = useCallback(() => {
    setName(''); setSubject(''); setColor(COLOR_PRESETS[0].color)
    setCapacity(20); setTeacherId(''); setNotes('')
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !subject.trim()) return
    onAdd({
      name: name.trim(),
      subject: subject.trim(),
      color,
      capacity,
      teacher_id: teacherId || undefined,
      notes: notes.trim() || undefined,
    })
    resetAndClose()
  }, [name, subject, color, capacity, teacherId, notes, onAdd, resetAndClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,10,10,.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) resetAndClose() }}
    >
      <div
        className={cn(
          'w-full max-w-md mx-4 p-6 rounded-2xl',
          'bg-[var(--card-bg)] border border-[var(--glass-border)]',
          'shadow-2xl animate-fade-in',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold-soft)' }}>
              <GraduationCap size={16} style={{ color: 'var(--gold)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>Add Class</h2>
          </div>
          <button
            onClick={resetAndClose}
            className={cn(
              'p-1.5 rounded-lg text-[var(--muted)]',
              'hover:bg-[var(--glass)] hover:text-[var(--text)]',
              'transition-colors duration-150',
            )}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Class Name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Math — CM2" className={inputCls} />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Subject <span style={{ color: 'var(--red)' }}>*</span></label>
            <select value={subject} onChange={e => { setSubject(e.target.value); const preset = COLOR_PRESETS.find(p => p.label === e.target.value); if (preset) setColor(preset.color) }} className={cn(inputCls, 'appearance-none cursor-pointer')}>
              <option value="">Select subject…</option>
              {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Teacher</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className={cn(inputCls, 'appearance-none cursor-pointer')}>
              <option value="">Unassigned</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Capacity</label>
            <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} min={1} className={inputCls} />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setColor(p.color)}
                  title={p.label}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all duration-150',
                    'hover:scale-110',
                    color === p.color ? 'ring-2 ring-offset-2' : '',
                  )}
                  style={{
                    backgroundColor: p.color,
                    ...(color === p.color ? { boxShadow: `0 0 0 2px var(--bg), 0 0 0 4px ${p.color}` } : {}),
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={resetAndClose} className={cn(cancelBtnCls)}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !subject.trim()}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white',
              'bg-gradient-to-r from-[#b3872a] to-[#0f6b4d]',
              'hover:opacity-90 active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-all duration-150',
            )}
          >
            Add Class
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared input classes ─── */
const inputCls = cn(
  'w-full px-3 py-2 rounded-xl text-sm',
  'bg-[var(--input-bg)] border border-[var(--glass-border)]',
  'outline-none focus:ring-2 focus:ring-[var(--gold)]/30',
  'placeholder:text-[var(--muted)]/50',
  'transition-shadow duration-150',
)
const cancelBtnCls = cn(
  'flex-1 py-2.5 rounded-xl text-sm font-medium',
  'bg-[var(--input-bg)] text-[var(--muted)] border border-[var(--glass-border)]',
  'hover:bg-[var(--glass)] transition-colors duration-150',
)

/* ─── Main Component ─── */
export function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  /* ── Fetch classes ── */
  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const { data } = await api.get('/classes')
        if (!cancelled) setClasses(data.classes ?? data ?? [])
      } catch { /* backend unavailable */ }
      finally { if (!cancelled) setIsLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* ── Stats ─── */
  const stats = {
    total: classes.length,
    active: classes.filter(c => (c.enrolled_count ?? 0) > 0).length,
    full: classes.filter(c => (c.enrolled_count ?? 0) >= (c.capacity ?? 0)).length,
    empty: classes.filter(c => (c.enrolled_count ?? 0) === 0).length,
  }

  /* ── Handlers ─── */
  const handleSelectClass = useCallback((cls: Class) => {
    setSelectedClass(prev => prev?.id === cls.id ? null : cls)
  }, [])

  const handleAddClass = useCallback(async (data: { name: string; subject: string; color: string; capacity: number; teacher_id?: string; notes?: string }) => {
    try {
      const { data: newClass } = await api.post('/classes', data)
      setClasses(prev => [...prev, newClass])
    } catch {
      // Optimistic fallback
      const temp: Class = {
        id: `temp-${Date.now()}`, academy_id: '1',
        name: data.name, subject: data.subject, color: data.color,
        capacity: data.capacity, enrolled_count: 0, teacher_name: '',
        status: 'empty', schedules: [],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setClasses(prev => [...prev, temp])
    }
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>Classes</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Manage your classes and schedules</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white',
              'bg-gradient-to-r from-[#b3872a] to-[#0f6b4d]',
              'hover:opacity-90 active:scale-[0.98]',
              'transition-all duration-150',
            )}
          >
            <Plus size={16} /> Add Class
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-6 pb-4 shrink-0">
          <StatChip label="Total" value={stats.total} color="var(--text)" />
          <StatChip label="Active" value={stats.active} color="var(--emerald)" />
          <StatChip label="Full" value={stats.full} color="var(--red)" />
          <StatChip label="Empty" value={stats.empty} color="var(--muted)" />
        </div>

        {/* Class Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ClassGrid classes={classes} onSelect={handleSelectClass} isLoading={isLoading} />
        </div>
      </div>

      {/* Class Detail sidebar */}
      <ClassDetail cls={selectedClass} isOpen={!!selectedClass} onClose={() => setSelectedClass(null)} />

      {/* Add modal */}
      <AddClassModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddClass} />
    </div>
  )
}

export default ClassesPage
