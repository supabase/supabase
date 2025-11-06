import { JSX, ReactNode } from 'react'
import { Badge, Card, cn } from 'ui'

export const ActionCard = (card: {
  icon: JSX.Element
  title: string
  bgColor?: string
  description?: string | ReactNode
  isBeta?: boolean
  className?: string
  onClick?: () => void
}) => {
  return (
    <Card
      className={cn(
        'grow bg-surface-100 p-3 transition-colors hover:bg-surface-200 border border-light hover:border-default cursor-pointer',
        card.className
      )}
      onClick={card.onClick}
    >
      <div className={`relative flex items-start gap-3`}>
        {card.isBeta && (
          <Badge className="absolute -right-5 -top-5 bg-surface-300 bg-opacity-100 text-xs text-foreground">
            Coming soon
          </Badge>
        )}
        <div
          className={`rounded-full ${card.bgColor} w-8 h-8 flex items-center justify-center flex-shrink-0`}
        >
          {card.icon}
        </div>
        <div className="flex-grow flex flex-col gap-0 min-w-0">
          <h3 title={card.title} className="text-sm text-foreground mb-0 truncate max-w-full">
            {card.title}
          </h3>
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
