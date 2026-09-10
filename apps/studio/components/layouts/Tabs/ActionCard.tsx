import type { ReactNode } from 'react'
import { Card, cn } from 'ui'

export const ActionCard = (card: {
  icon: ReactNode
  title: string
  description?: string
  bgColor: string
  onClick?: () => void
}) => {
  return (
    <Card
      className="grow bg-surface-100 p-3 transition-colors hover:bg-surface-200 border hover:border-default cursor-pointer"
      onClick={card.onClick}
    >
      <div className={cn('relative flex gap-3', card.description ? 'items-start' : 'items-center')}>
        <div
          className={`rounded-full ${card.bgColor} w-8 h-8 flex items-center justify-center shrink-0`}
        >
          {card.icon}
        </div>
        <div className="flex flex-col gap-0">
          <h3 className="text-sm text-foreground mb-0">{card.title}</h3>
          {card.description && <p className="text-xs text-foreground-light">{card.description}</p>}
        </div>
      </div>
    </Card>
  )
}
