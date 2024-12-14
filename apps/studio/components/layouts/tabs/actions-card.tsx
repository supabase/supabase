import { Badge, Card } from 'ui'

export const ActionCard = (card: {
  icon: JSX.Element
  title: string
  description: string
  bgColor: string
  isBeta?: boolean
  onClick?: () => void
}) => {
  return (
    <Card
      className="grow bg-surface-100 p-3 transition-colors hover:bg-surface-200 border border-light hover:border-default cursor-pointer"
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
        <div className="flex flex-col gap-0">
          <h3 className="text-sm text-foreground mb-0">{card.title}</h3>
          <p className="text-xs text-foreground-light">{card.description}</p>
        </div>
      </div>
    </Card>
  )
}
