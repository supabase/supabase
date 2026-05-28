import { memo } from 'react'
import { MousePointer2 } from 'lucide-react'
import { cn } from 'ui'

function CursorInner({
  className,
  style,
  color,
  name,
}: {
  className?: string
  style?: React.CSSProperties
  color: string
  name: string
}) {
  return (
    <div className={cn('pointer-events-none', className)} style={style}>
      <MousePointer2 color={color} fill={color} size={30} />
      <div
        className="mt-1 px-2 py-1 rounded-sm text-xs font-bold text-white text-center whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}

export const Cursor = memo(CursorInner)
