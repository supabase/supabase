import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { ExternalLink, Eye, EyeOff, FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  ScrollArea,
} from 'ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from 'ui/src/components/shadcn/ui/select'

import { AdvisorRulesPreview } from './AdvisorRulesPreview'
import { Branching2Preview } from './Branching2Preview'
import { CLSPreview } from './CLSPreview'
import { useFeaturePreviewContext, useFeaturePreviewModal } from './FeaturePreviewContext'
import { FloatingMobileToolbarPreview } from './FloatingMobileToolbarPreview'
import { PgDeltaDiffPreview } from './PgDeltaDiffPreview'
import { PlatformWebhooksPreview } from './PlatformWebhooksPreview'
import { QueueOperationsPreview } from './QueueOperationsPreview'
import { TableFilterBarPreview } from './TableFilterBarPreview'
import { UnifiedLogsPreview } from './UnifiedLogsPreview'
import { FeaturePreview, useFeaturePreviews } from './useFeaturePreviews'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const FEATURE_PREVIEW_KEY_TO_CONTENT: {
  [key: string]: ReactNode
} = {
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0]: <Branching2Preview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF]: <PgDeltaDiffPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES]: <AdvisorRulesPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]: <CLSPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS]: <UnifiedLogsPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS]: <QueueOperationsPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR]: <TableFilterBarPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_PLATFORM_WEBHOOKS]: <PlatformWebhooksPreview />,
  [LOCAL_STORAGE_KEYS.UI_PREVIEW_FLOATING_MOBILE_TOOLBAR]: <FloatingMobileToolbarPreview />,
}

export const FeaturePreviewModal = () => {
  const { ref } = useParams()
  const featurePreviews = useFeaturePreviews()
  const {
    showFeaturePreviewModal,
    selectedFeatureKey,
    selectFeaturePreview,
    toggleFeaturePreviewModal,
  } = useFeaturePreviewModal()
  const { data: org } = useSelectedOrganizationQuery()
  const featurePreviewContext = useFeaturePreviewContext()
  const { mutate: sendEvent } = useSendEventMutation()

  const [isDismissedTableFilterBar, setIsDismissedTableFilterBar] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABLE_EDITOR_NEW_FILTER_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const { flags, onUpdateFlag } = featurePreviewContext
  const allFeaturePreviews = (
    IS_PLATFORM ? featurePreviews : featurePreviews.filter((x) => !x.isPlatformOnly)
  ).filter((x) => x.enabled)

  const selectedFeature =
    allFeaturePreviews.find((preview) => preview.key === selectedFeatureKey) ??
    allFeaturePreviews[0]
  const isSelectedFeatureEnabled = flags[selectedFeature?.key]

  const toggleFeature = () => {
    if (!selectedFeature) return
    onUpdateFlag(selectedFeature.key, !isSelectedFeatureEnabled)
    sendEvent({
      action: isSelectedFeatureEnabled ? 'feature_preview_disabled' : 'feature_preview_enabled',
      properties: { feature: selectedFeature.key },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })

    if (
      selectedFeature.key === LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR &&
      !isDismissedTableFilterBar
    ) {
      setIsDismissedTableFilterBar(true)
    }
  }

  return (
    <Dialog open={showFeaturePreviewModal} onOpenChange={toggleFeaturePreviewModal}>
      <DialogContent size="xlarge" className="flex flex-col !max-w-4xl h-[90dvh] md:h-auto">
        <DialogHeader>
          <DialogTitle>Dashboard feature previews</DialogTitle>
          <DialogDescription>Get early access to new features and give feedback</DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="!p-0 flex-1 min-h-0 h-full">
          {allFeaturePreviews.length > 0 ? (
            <div className="max-h-full flex-1 min-h-0 h-full flex flex-col gap-y-1 md:gap-y-4 md:flex-row">
              <div>
                <ScrollArea className="hidden md:block h-[550px] w-[280px] border-r">
                  {allFeaturePreviews.map((feature) => (
                    <FeaturePreviewItem
                      key={feature.key}
                      feature={feature}
                      selectedFeature={selectedFeature}
                      selectFeaturePreview={selectFeaturePreview}
                    />
                  ))}
                </ScrollArea>
              </div>
              <div className="block md:hidden px-4 pt-4">
                <Select
                  value={selectedFeature.key}
                  onValueChange={selectFeaturePreview}
                  defaultValue={selectedFeature.name}
                >
                  <SelectTrigger id="feature-preview-select">
                    <div className="flex items-center gap-x-2">
                      {flags[selectedFeature.key] ?? false ? (
                        <Eye size={14} strokeWidth={2} className="text-brand" />
                      ) : (
                        <EyeOff size={14} strokeWidth={1.5} className="text-foreground-light" />
                      )}
                      <p>{selectedFeature.name}</p>
                      {selectedFeature.isNew && <Badge variant="success">New</Badge>}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="!p-0 [&>div]:!w-full [&>div]:!p-0 [&>div]:!flex [&>div]:!flex-col w-full flex">
                    {allFeaturePreviews.map((feature) => (
                      <SelectItem
                        key={feature.key}
                        value={feature.key}
                        className="p-0 [&>span:nth-child(2)]:w-full [&>span:nth-child(1)]:left-3"
                      >
                        <FeaturePreviewItem
                          feature={feature}
                          selectedFeature={selectedFeature}
                          selectFeaturePreview={selectFeaturePreview}
                          className="pl-10 py-3 bg-transparent"
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-auto min-h-0 max-h-auto md:max-h-[550px] p-4 pb-0 flex flex-col">
                <div className="flex items-center justify-between border-b gap-2 pb-3">
                  <p>{selectedFeature?.name}</p>
                  <div className="flex items-center gap-x-2">
                    {selectedFeature?.discussionsUrl !== undefined && (
                      <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                        <Link
                          href={selectedFeature.discussionsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Give feedback
                        </Link>
                      </Button>
                    )}
                    <Button type="default" onClick={() => toggleFeature()}>
                      {isSelectedFeatureEnabled ? 'Disable' : 'Enable'} feature
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-scroll pt-3 pb-4">
                  {FEATURE_PREVIEW_KEY_TO_CONTENT[selectedFeature?.key ?? '']}
                </div>
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
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

const FeaturePreviewItem = ({
  feature,
  selectedFeature,
  selectFeaturePreview,
  className,
}: {
  feature: FeaturePreview
  selectedFeature: FeaturePreview
  selectFeaturePreview: (key: string) => void
  className?: string
}) => {
  const featurePreviewContext = useFeaturePreviewContext()
  const { flags } = featurePreviewContext
  const isEnabled = flags[feature.key] ?? false

  return (
    <button
      type="button"
      key={feature.key}
      onClick={() => selectFeaturePreview(feature.key)}
      className={cn(
        '!w-full flex-1 flex items-center justify-between p-4 border-b cursor-pointer bg transition',
        selectedFeature?.key === feature.key ? 'bg-surface-300' : 'bg-surface-100',
        className
      )}
    >
      <div className="flex items-center gap-x-3">
        {isEnabled ? (
          <Eye size={14} strokeWidth={2} className="text-brand" />
        ) : (
          <EyeOff size={14} strokeWidth={1.5} className="text-foreground-light" />
        )}
        <p className="text-sm truncate" title={feature.name}>
          {feature.name}
        </p>
      </div>
      {feature.isNew && <Badge variant="success">New</Badge>}
    </button>
  )
}
