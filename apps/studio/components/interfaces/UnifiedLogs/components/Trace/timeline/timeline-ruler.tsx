interface TimelineRulerProps {
  duration: number
  showTimestamps: boolean
}

export function TimelineRuler({ duration, showTimestamps }: TimelineRulerProps) {
  return (
    <div className="h-8 border-neutral-900 sticky top-0 flex items-end text-xs text-neutral-500">
      {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
        <div
          key={i}
          className="border-l border-neutral-800 absolute top-0 h-2"
          style={{ left: `${((i * 10) / duration) * 100}%` }}
        >
          <span className="absolute -left-3 -bottom-5">{i * 10}ms</span>
        </div>
      ))}
    </div>
  )
}
