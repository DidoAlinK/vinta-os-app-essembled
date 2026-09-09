/**
 * Vinta School OS — Session Block
 * Individual session block rendered on the calendar grid.
 * Supports drag-to-move and edge-resize (top/bottom handles).
 */

import { useCallback, useRef } from 'react'
import { cn } from '../../lib/cn'
import { formatTime } from '../../lib/formatters'
import type { CalendarSession } from '../../types/calendar'

// ============================================
// Props
// ============================================

export interface SessionBlockProps {
  session: CalendarSession
  onClick: () => void
  onDragStart: () => void
  onResizeStart: (edge: 'top' | 'bottom') => void
}

// ============================================
// Helpers
// ============================================

/** Convert hex color to an rgba string with the given alpha */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ============================================
// Component
// ============================================

export default function SessionBlock({
  session,
  onClick,
  onDragStart,
  onResizeStart,
}: SessionBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null)
  const dragStarted = useRef(false)
  const mouseDownPos = useRef({ x: 0, y: 0 })

  // ── Pointer handlers (drag) ───────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore clicks on resize handles
      if ((e.target as HTMLElement).dataset.resize) return

      mouseDownPos.current = { x: e.clientX, y: e.clientY }
      dragStarted.current = false

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = Math.abs(moveEvent.clientX - mouseDownPos.current.x)
        const dy = Math.abs(moveEvent.clientY - mouseDownPos.current.y)

        if (!dragStarted.current && (dx > 4 || dy > 4)) {
          dragStarted.current = true
          onDragStart()
        }
      }

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)

        if (!dragStarted.current) {
          onClick()
        }
        dragStarted.current = false
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    },
    [onClick, onDragStart],
  )

  // ── Resize handle pointer down ────────────────

  const handleResizePointerDown = useCallback(
    (edge: 'top' | 'bottom') => (e: React.PointerEvent) => {
      e.stopPropagation()
      onResizeStart(edge)
    },
    [onResizeStart],
  )

  // ── Derived style values ──────────────────────

  const color = session.color || '#b3872a'
  const bg = hexToRgba(color, 0.15)
  const hoverBg = hexToRgba(color, 0.22)
  const isCompact = session.duration < 0.75 // less than 45 min → hide some details

  // ── Render ────────────────────────────────────

  return (
    <div
      ref={blockRef}
      onPointerDown={handlePointerDown}
      className={cn(
        'group absolute inset-x-0.5 flex flex-col rounded-lg cursor-grab active:cursor-grabbing select-none',
        'border-l-[3px] transition-[background-color] duration-150',
        'overflow-hidden',
      )}
      style={{
        top: session.top,
        height: session.height,
        backgroundColor: bg,
        borderLeftColor: color,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.backgroundColor = hoverBg
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.backgroundColor = bg
      }}
      title={`${session.class_name} — ${formatTime(session.start_time)}–${formatTime(session.end_time)}`}
    >
      {/* ── Top resize handle ────────────────────── */}
      <div
        data-resize="top"
        onPointerDown={handleResizePointerDown('top')}
        className={cn(
          'absolute top-0 inset-x-0 h-1.5 cursor-ns-resize z-10',
          'transition-opacity duration-150',
          'opacity-0 group-hover:opacity-100',
        )}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* ── Content ──────────────────────────────── */}
      <div className="flex-1 px-2 py-1 min-h-0 overflow-hidden">
        <p
          className="text-[11px] font-semibold leading-tight truncate"
          style={{ color, fontFamily: 'var(--font-heading)' }}
        >
          {session.class_name}
        </p>

        {!isCompact && (
          <p className="text-[10px] leading-tight text-[var(--muted)] truncate mt-0.5">
            {session.teacher_name}
          </p>
        )}

        {!isCompact && (
          <p className="text-[10px] leading-tight text-[var(--muted)] truncate">
            {formatTime(session.start_time)} — {formatTime(session.end_time)}
          </p>
        )}

        {/* Show time range inline when very compact */}
        {isCompact && (
          <p className="text-[9px] leading-tight text-[var(--muted)] truncate">
            {formatTime(session.start_time)}
          </p>
        )}
      </div>

      {/* ── Bottom resize handle ─────────────────── */}
      <div
        data-resize="bottom"
        onPointerDown={handleResizePointerDown('bottom')}
        className={cn(
          'absolute bottom-0 inset-x-0 h-1.5 cursor-ns-resize z-10',
          'transition-opacity duration-150',
          'opacity-0 group-hover:opacity-100',
        )}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

