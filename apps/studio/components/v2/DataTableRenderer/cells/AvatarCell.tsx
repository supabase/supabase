interface AvatarCellProps {
  value: unknown
}

function getInitials(str: string): string {
  const parts = str
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return str.slice(0, 2).toUpperCase()
}

const COLORS = [
  'bg-brand-400/30 text-brand',
  'bg-purple-400/30 text-purple-600',
  'bg-blue-400/30 text-blue-600',
  'bg-orange-400/30 text-orange-600',
  'bg-pink-400/30 text-pink-600',
]

export function AvatarCell({ value }: AvatarCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">—</span>
  }

  const str = String(value)
  const initials = getInitials(str)
  const colorClass = COLORS[str.charCodeAt(0) % COLORS.length]

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${colorClass}`}
      >
        {initials}
      </span>
      <span className="truncate text-xs">{str}</span>
    </div>
  )
}
