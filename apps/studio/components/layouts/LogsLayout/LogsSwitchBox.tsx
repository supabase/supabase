import { Button } from 'ui'

interface LogsSwitchBoxProps {
  title: string
  description: string
  buttonText: string
  onClick: () => void
  icon: React.ReactNode
  variant?: 'brand' | 'muted'
}

export function LogsSwitchBox({
  title,
  description,
  buttonText,
  onClick,
  icon,
  variant = 'brand',
}: LogsSwitchBoxProps) {
  return (
    <div className="mx-4 mt-4 mb-4">
      <div className="border border-border-muted rounded-lg p-4 bg-surface-75">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                variant === 'brand' ? 'bg-brand-500' : 'bg-foreground-muted'
              }`}
            >
              <div className={variant === 'brand' ? 'text-white' : 'text-background'}>{icon}</div>
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-xs text-foreground-light mb-3">{description}</p>
          <Button type="default" size="tiny" onClick={onClick}>
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
