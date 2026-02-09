import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { ExternalLink, Eye, EyeOff, FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Badge, Button, cn, Modal, ScrollArea } from 'ui'

import { AdvisorRulesPreview } from './AdvisorRulesPreview'
import { APISidePanelPreview } from './APISidePanelPreview'
import { Branching2Preview } from './Branching2Preview'
import { CLSPreview } from './CLSPreview'
import { FEATURE_PREVIEWS } from './FeaturePreview.constants'
import { useFeaturePreviewContext, useFeaturePreviewModal } from './FeaturePreviewContext'
import { QueueOperationsPreview } from './QueueOperationsPreview'
import { TableFilterBarPreview } from './TableFilterBarPreview'
import { UnifiedLogsPreview } from './UnifiedLogsPreview'

const FEATURE_PREVIEW_KEY_TO_CONTENT: {
  [key: string]: ReactNode
} = {
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0]: <Branching2Preview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES]: <AdvisorRulesPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL]: <APISidePanelPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]: <CLSPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS]: <UnifiedLogsPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS]: <QueueOperationsPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR]: <TableFilterBarPreview />,
}

const FeaturePreviewModal = () => {
  const { ref } = useParams()
  const {
    showFeaturePreviewModal,
    selectedFeatureKey,
    selectFeaturePreview,
    closeFeaturePreviewModal,
    isFeaturePreviewReleasedToPublic,
  } = useFeaturePreviewModal()
  const { data: org } = useSelectedOrganizationQuery()
  const featurePreviewContext = useFeaturePreviewContext()
  const { mutate: sendEvent } = useSendEventMutation()

  const { flags, onUpdateFlag } = featurePreviewContext
  const selectedFeature =
    FEATURE_PREVIEWS.find((preview) => preview.key === selectedFeatureKey) ?? FEATURE_PREVIEWS[0]
  const isSelectedFeatureEnabled = flags[selectedFeatureKey]

  const allFeaturePreviews = IS_PLATFORM
    ? FEATURE_PREVIEWS
    : FEATURE_PREVIEWS.filter((x) => !x.isPlatformOnly)

  const toggleFeature = () => {
    onUpdateFlag(selectedFeature.key, !isSelectedFeatureEnabled)
    sendEvent({
      action: isSelectedFeatureEnabled ? 'feature_preview_disabled' : 'feature_preview_enabled',
      properties: { feature: selectedFeature.key },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
  }

  return (
    <Modal
      hideFooter
      showCloseButton
      size="xlarge"
      className="!max-w-4xl"
      header="Dashboard feature previews"
      visible={showFeaturePreviewModal}
      onCancel={closeFeaturePreviewModal}
    >
      {FEATURE_PREVIEWS.length > 0 ? (
        <div className="flex">
          <div>
            <ScrollArea className="h-[550px] w-[280px] border-r">
              {allFeaturePreviews
                .filter((feature) => isFeaturePreviewReleasedToPublic(feature))
                .map((feature) => {
                  const isEnabled = flags[feature.key] ?? false

                  return (
                    <div
                      key={feature.key}
                      onClick={() => selectFeaturePreview(feature.key)}
                      className={cn(
                        'flex items-center space-x-3 p-4 border-b cursor-pointer bg transition',
                        selectedFeature.key === feature.key ? 'bg-surface-300' : 'bg-surface-100'
                      )}
                    >
                      {isEnabled ? (
                        <Eye size={14} strokeWidth={2} className="text-brand" />
                      ) : (
                        <EyeOff size={14} strokeWidth={1.5} className="text-foreground-light" />
                      )}
                      <p className="text-sm truncate" title={feature.name}>
                        {feature.name}
                      </p>
                    </div>
                  )
                })}
            </ScrollArea>
          </div>
          <div className="flex-grow max-h-[550px] p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <p>{selectedFeature?.name}</p>
                {selectedFeature?.isNew && <Badge variant="success">New</Badge>}
              </div>
              <div className="flex items-center gap-x-2">
                {selectedFeature?.discussionsUrl !== undefined && (
                  <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                    <Link href={selectedFeature.discussionsUrl} target="_blank" rel="noreferrer">
                      Give feedback
                    </Link>
                  </Button>
                )}
                <Button type="default" onClick={() => toggleFeature()}>
                  {isSelectedFeatureEnabled ? 'Disable' : 'Enable'} feature
                </Button>
              </div>
            </div>
            {FEATURE_PREVIEW_KEY_TO_CONTENT[selectedFeature.key]}
          </div>
        </div>
      ) : (
        <div className="h-[550px] flex flex-col items-center justify-center">
          <FlaskConical size={30} strokeWidth={1.5} className="text-foreground-light" />
          <div className="mt-1 mb-3 flex flex-col items-center gap-y-0.5">
            <p className="text-sm">No feature previews available</p>
            <p className="text-sm text-foreground-light">
              Have an idea for the dashboard? Let us know via GitHub Discussions!
            </p>
          </div>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://github.com/orgs/supabase/discussions/categories/feature-requests"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Discussions
            </Link>
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default FeaturePreviewModal
