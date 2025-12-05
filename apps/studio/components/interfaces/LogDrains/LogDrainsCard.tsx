import { Card } from 'ui'

interface LogDrainsCardProps {
  title: string
  description: string
  rightLabel?: string
  icon: React.ReactNode
  onClick: () => void
}

export const LogDrainsCard = ({
  title,
  description,
  rightLabel,
  icon,
  onClick,
}: LogDrainsCardProps) => {
  return (
    <button className="w-full h-full text-left" onClick={onClick}>
      <Card className="p-6 cursor-pointer hover:bg-surface-200 hover:border-strong transition-colors h-48">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between w-full">
            <div>{icon}</div>
            <div className="text-xs text-foreground-light">{rightLabel}</div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-base">{title}</h1>
            <p className="text-sm text-foreground-light leading-relaxed">{description}</p>
          </div>
        </div>
      </Card>
    </button>
  )
}
