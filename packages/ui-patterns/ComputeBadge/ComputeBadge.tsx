import { Badge } from 'ui/src/components/shadcn/ui/badge'
import { components } from 'shared-types/types/api'
import { cn } from 'ui/src/lib/utils'

interface ComputeBadgeProps extends React.ComponentProps<typeof Badge> {
  infraComputeSize: components['schemas']['DbInstanceSize'] | undefined
}

export function ComputeBadge({ infraComputeSize, className, ...props }: ComputeBadgeProps) {
  const smallCompute =
    infraComputeSize?.toLocaleLowerCase() === 'micro' ||
    infraComputeSize?.toLocaleLowerCase() === 'nano'

  return (
    <Badge
      className={cn(
        'rounded-md text-center flex justify-center font-mono uppercase',
        smallCompute ? 'bg-surface-300 text-foreground' : 'bg-brand text-surface',
        className
      )}
      variant={!infraComputeSize ? 'default' : smallCompute ? 'default' : 'brand'}
      {...props}
    >
      {infraComputeSize}
    </Badge>
  )
}
