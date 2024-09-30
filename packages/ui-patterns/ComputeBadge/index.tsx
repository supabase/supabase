import { components } from 'api-types'
import { Badge, cn } from 'ui'

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
        'group-data-[state=open]:bg-opacity-20 group-data-[state=open]:ring-2 group-data-[state=open]:ring-opacity-20',
        'transition-all',
        smallCompute
          ? 'group-data-[state=open]:ring-foreground-muted bg-opacity-50 group-data-[state=open]:bg-opacity-75'
          : 'group-data-[state=open]:ring-brand',

        className
      )}
      variant={!infraComputeSize ? 'default' : smallCompute ? 'default' : 'brand'}
      {...props}
    >
      {infraComputeSize}
    </Badge>
  )
}
