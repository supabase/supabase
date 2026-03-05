import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

interface FloatingWindowProps {
  title?: string
  showTitleBar?: boolean
  children: React.ReactNode
  initialPosition?: { x: number; y: number }
  className?: string
  width?: number
  height?: number
}

export function FloatingWindow({
  title,
  showTitleBar = true,
  children,
  initialPosition = { x: 40, y: 40 },
  className,
  width = 480,
  height = 320,
}: FloatingWindowProps) {
  const [position, setPosition] = useState(initialPosition)
  const dragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: position.x,
      winY: position.y,
    }
    e.preventDefault()
  }, [position])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - dragStart.current.mouseX
      const dy = e.clientY - dragStart.current.mouseY
      const rawX = dragStart.current.winX + dx
      const rawY = dragStart.current.winY + dy

      // Clamp to parent bounds
      const parent = windowRef.current?.parentElement
      const maxX = parent ? parent.clientWidth - width : rawX
      const maxY = parent ? parent.clientHeight - height : rawY

      setPosition({
        x: Math.max(0, Math.min(rawX, maxX)),
        y: Math.max(0, Math.min(rawY, maxY)),
      })
    }
    const onMouseUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [width, height])

  return (
    <div
      ref={windowRef}
      className={cn(
        'absolute rounded-lg border border-default bg-surface-200 shadow-2xl flex flex-col overflow-hidden',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        zIndex: 10,
      }}
    >
      {/* Title bar */}
      {showTitleBar && (
        <div
          className="flex items-center gap-2 px-3 h-9 bg-surface-300 border-b border-default shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
        >
          {/* Traffic lights */}
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] shrink-0" />
          {title && (
            <span className="flex-1 text-center text-xs text-white/50 font-medium pr-9 truncate">
              {title}
            </span>
          )}
        </div>
      )}
      {/* Content — also acts as drag handle when there's no title bar */}
      <div
        className={cn('flex-1 overflow-hidden', !showTitleBar && 'cursor-grab active:cursor-grabbing select-none')}
        onMouseDown={!showTitleBar ? onMouseDown : undefined}
      >
        {children}
      </div>
    </div>
  )
}
