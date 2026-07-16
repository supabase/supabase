import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { CircleHelpIcon, Undo2, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { Badge, Button, cn } from 'ui'

import {
  useFeaturePreviewModal,
  useUnifiedLogsPreview,
} from '../App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'

interface UnifiedLogsBannerProps {
  className?: string
}

export function UnifiedLogsBanner({ className = 'mx-4 mt-4' }: UnifiedLogsBannerProps) {
  const router = useRouter()
  const { ref } = useParams()

  const { selectFeaturePreview } = useFeaturePreviewModal()
  const { enable, disable, isDefaultOptIn, isEnabled } = useUnifiedLogsPreview()
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_SIDEBAR_BANNER_DISMISSED,
    false
  )

  if (!IS_PLATFORM) return null

  // Keep the "Go back" banner visible even after dismissal so manually opted-in users can switch back
  if (isDismissed && !(isEnabled && !isDefaultOptIn)) return null

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
      <div className="flex items-start justify-between">
        <Badge variant="success">New</Badge>
        <Button
          variant="text"
          size="tiny"
          icon={<X size={14} strokeWidth={1.5} />}
          onClick={() => setIsDismissed(true)}
          className="opacity-75 hover:opacity-100 -mt-1 -mr-1 px-1"
          aria-label="Dismiss banner"
        />
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
