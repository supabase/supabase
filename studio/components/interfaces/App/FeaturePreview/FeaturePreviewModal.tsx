import { useTelemetryProps } from 'common'
import { FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, IconExternalLink, IconEye, IconEyeOff, Modal, ScrollArea, cn } from 'ui'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import { useAppStateSnapshot } from 'state/app-state'
import APISidePanelPreview from './APISidePanelPreview'
import { useFeaturePreviewContext } from './FeaturePreviewContext'

// [Ivan] We should probably move this to a separate file, together with LOCAL_STORAGE_KEYS. We should make adding new feature previews as simple as possible.

const FEATURE_PREVIEWS: { key: string; name: string; content: any; discussionsUrl?: string }[] = [
  // {
  //   key: LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT,
  //   name: 'Global navigation update',
  //   content: null,
  // },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
    name: 'Project API documentation',
    content: <APISidePanelPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/18038',
  },
]

const FeaturePreviewModal = () => {
  const router = useRouter()
  const snap = useAppStateSnapshot()
  const telemetryProps = useTelemetryProps()
  const featurePreviewContext = useFeaturePreviewContext()
  const [selectedFeatureKey, setSelectedFeatureKey] = useState<string>(FEATURE_PREVIEWS?.[0]?.key)

  const { flags, onUpdateFlag } = featurePreviewContext
  const selectedFeature = FEATURE_PREVIEWS.find((preview) => preview.key === selectedFeatureKey)
  const isSelectedFeatureEnabled = flags[selectedFeatureKey]

  const toggleFeature = () => {
    onUpdateFlag(selectedFeatureKey, !isSelectedFeatureEnabled)
    Telemetry.sendEvent(
      {
        category: 'ui_feature_previews',
        action: isSelectedFeatureEnabled ? 'disabled' : 'enabled',
        label: selectedFeatureKey,
      },
      telemetryProps,
      router
    )
  }

  return (
    <Modal
      hideFooter
      showCloseButton
      size="xlarge"
      className="max-w-4xl"
      header="Dashboard feature previews"
      visible={snap.showFeaturePreviewModal}
      onCancel={() => snap.setShowFeaturePreviewModal(false)}
    >
      {FEATURE_PREVIEWS.length > 0 ? (
        <div className="flex border-t">
          <div>
            <ScrollArea className="h-[550px] w-[240px] border-r">
              {FEATURE_PREVIEWS.map((feature) => {
                const isEnabled = flags[feature.key] ?? false

                return (
                  <div
                    key={feature.key}
                    onClick={() => setSelectedFeatureKey(feature.key)}
                    className={cn(
                      'flex items-center space-x-3 p-4 border-b cursor-pointer bg transition',
                      selectedFeatureKey === feature.key ? 'bg-surface-200' : ''
                    )}
                  >
                    {isEnabled ? (
                      <IconEye size={14} strokeWidth={2} className="text-brand" />
                    ) : (
                      <IconEyeOff size={14} strokeWidth={1.5} className="text-foreground-light" />
                    )}
                    <p className="text-sm">{feature.name}</p>
                  </div>
                )
              })}
            </ScrollArea>
          </div>
          <div className="flex-grow max-h-[550px] p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p>{selectedFeature?.name}</p>
              <div className="flex items-center space-x-2">
                {selectedFeature?.discussionsUrl !== undefined && (
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
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
            {selectedFeature?.content}
          </div>
        </div>
      ) : (
        <div className="h-[550px] flex flex-col items-center justify-center">
          <FlaskConical size={30} strokeWidth={1.5} className="text-foreground-light" />
          <div className="mt-1 mb-3 flex flex-col items-center gap-y-0.5">
            <p className="text-sm">No feature previews available</p>
            <p className="text-sm text-foreground-light">
              Have an idea for the dashboard? Let us know via Github Discussions!
            </p>
          </div>
          <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://github.com/orgs/supabase/discussions/categories/feature-requests"
              target="_blank"
              rel="noreferrer"
            >
              Github Discussions
            </Link>
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default FeaturePreviewModal
