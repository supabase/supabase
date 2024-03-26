import { AiIconAnimation } from 'ui/src/layout/ai-icon-animation/ai-icon-animation'

interface AiIconProps {
  className?: string
}

export const AiIcon = ({ className }: AiIconProps) => (
  <AiIconAnimation className={className} allowHoverEffect />
)

export const AiIconChat = ({ loading = false }) => (
  <AiIconAnimation className="ml-0.5" loading={loading} allowHoverEffect />
)
