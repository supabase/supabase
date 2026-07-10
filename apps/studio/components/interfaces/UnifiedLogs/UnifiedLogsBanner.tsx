import { useParams } from 'common'
import { CircleHelpIcon, Undo2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { Badge, Button, cn } from 'ui'

import {
  useFeaturePreviewModal,
  useUnifiedLogsPreview,
} from '../App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface UnifiedLogsBannerProps {
  className?: string
}

export function UnifiedLogsBanner({ className = 'mx-4 mt-4' }: UnifiedLogsBannerProps) {
  const router = useRouter()
  const { ref } = useParams()

  const { selectFeaturePreview } = useFeaturePreviewModal()
  const { enable, disable, isDefaultOptIn, isEnabled } = useUnifiedLogsPreview()

  const cardClassName = cn(
    'rounded-lg border p-4 space-y-3 text-left',
    'bg-muted/10 border-border/50',
    className
  )

  const onSwitchBack = () => {
    disable()
    router.push(`/project/${ref}/logs/explorer`)
  }

  const onEnable = () => {
    enable()
    router.push(`/project/${ref}/logs`)
  }

  if (isEnabled && !isDefaultOptIn) {
    return (
      <div className={cn('rounded-lg border px-4 py-3', 'bg-muted/10 border-border/50', className)}>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            Go back to old logs
          </p>
          <ButtonTooltip
            variant="default"
            className="shrink-0 px-1.5"
            icon={<Undo2 />}
            onClick={onSwitchBack}
            tooltip={{ content: { side: 'bottom', text: 'Switch back' } }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cardClassName}>
      <div className="flex justify-start">
        <Badge variant="success">New</Badge>
      </div>
      <h3 className="font-medium text-sm text-foreground">Introducing unified logs</h3>
      <div className="flex justify-start items-start gap-x-2">
        {isDefaultOptIn ? (
          <Button
            variant="default"
            icon={<CircleHelpIcon />}
            onClick={() => selectFeaturePreview('supabase-ui-preview-unified-logs')}
          >
            More information
          </Button>
        ) : (
          <>
            <Button variant="default" onClick={onEnable}>
              Enable preview
            </Button>
            <ButtonTooltip
              variant="default"
              className="px-1.5"
              icon={<CircleHelpIcon />}
              onClick={() => selectFeaturePreview('supabase-ui-preview-unified-logs')}
              tooltip={{ content: { side: 'bottom', text: 'More information' } }}
            />
          </>
        )}
      </div>
    </div>
  )
}
