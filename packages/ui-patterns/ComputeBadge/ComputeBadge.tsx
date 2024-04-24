import { Badge } from 'ui/src/components/shadcn/ui/badge'
import { components } from 'shared-types/types/api'

export interface ComputeBadgeProps extends React.ComponentProps<typeof Badge> {
  plan: components['schemas']['DesiredInstanceSize']
}

export function ComputeBadge({ plan, ...props }: ComputeBadgeProps) {
  return (
    <Badge
      className="rounded-md w-16 text-center flex justify-center font-mono uppercase"
      variant={plan.toLowerCase() === 'micro' ? 'default' : 'brand'}
      {...props}
    >
      {plan}
    </Badge>
  )
}
