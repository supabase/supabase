import { AiIconAnimation } from '@ui/layout/ai-icon-animation'
import { cn } from '@ui/lib/utils'

interface AiIconProps {
  className?: string
}

export const AiIcon = ({ className }: AiIconProps) => (
  <AiIconAnimation className={cn('mr-2', className)} allowHoverEffect />
)

export const AiIconChat = ({ loading = false }) => (
  <AiIconAnimation className="ml-0.5" loading={loading} allowHoverEffect />
)
