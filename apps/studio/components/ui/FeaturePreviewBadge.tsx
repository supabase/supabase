import { FlaskConical } from 'lucide-react'
import { Badge, cn } from 'ui'

import { useFeaturePreviewModal } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

interface FeaturePreviewBadgeProps {
  featureKey: string
  className?: string
}

export const FeaturePreviewBadge = ({ featureKey, className }: FeaturePreviewBadgeProps) => {
  const { selectFeaturePreview } = useFeaturePreviewModal()

  return (
    <button
      type="button"
      onClick={() => selectFeaturePreview(featureKey)}
      className="group"
      title="Feature preview — click to manage"
    >
      <Badge
        variant="default"
        className={cn(
          'cursor-pointer group-hover:border-foreground-light group-hover:text-foreground transition-colors',
          className
        )}
      >
        <FlaskConical size={8} strokeWidth={1.5} />
        Feature preview
      </Badge>
    </button>
  )
}
