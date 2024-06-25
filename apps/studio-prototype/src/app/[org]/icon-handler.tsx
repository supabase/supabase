import { Box, GitBranch, Shield } from 'lucide-react'
import { cn } from 'ui'

export const IconHandler = (props: { icon: string; className?: string }) => {
  switch (props.icon) {
    case 'prod':
      return (
        <div>
          <Shield className={cn('w-4 text-warning', props.className)} size={14} />
        </div>
      )
    case 'preview':
      return (
        <div>
          <GitBranch className={cn('w-4 text-foreground-muted', props.className)} size={14} />
        </div>
      )
    case 'long-running':
      return (
        <div>
          <GitBranch className={cn('w-4 text-foreground-muted', props.className)} size={14} />
        </div>
      )
    case 'project':
      return <Box className={cn('w-4 text-foreground-muted', props.className)} size={14} />
    default:
      return null
  }
}
