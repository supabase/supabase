import type { ReactNode } from 'react'
import { Card, cn } from 'ui'

export const ActionCard = (card: {
  icon: ReactNode
  title: string
  bgColor?: string
  description?: ReactNode
  className?: string
  onClick?: () => void
}) => {
  return (
    <Card
      className={cn(
        'grow bg-surface-100 p-3 transition-colors hover:bg-surface-200 border hover:border-default cursor-pointer',
        card.className
      )}
      onClick={card.onClick}
    >
      <div className="relative flex items-start gap-3">
        <div
          className={`rounded-full ${card.bgColor} w-8 h-8 flex items-center justify-center shrink-0`}
        >
          {card.icon}
        </div>
        <div className="grow flex flex-col gap-0 min-w-0">
          <div className="flex items-center gap-x-2">
            <h3 title={card.title} className="text-sm text-foreground mb-0 truncate max-w-full">
              {card.title}
            </h3>
          </div>
          {typeof card.description === 'string' ? (
            <pre className="text-xs text-foreground-light font-sans">{card.description}</pre>
          ) : (
            card.description
          )}
        </div>
      </div>
    </Card>
  )
}
