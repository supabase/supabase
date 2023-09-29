import { useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, IconEye, IconEyeOff, Modal, ScrollArea, cn } from 'ui'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import { useAppStateSnapshot } from 'state/app-state'
import { Markdown } from '../Markdown'
import { useFeaturePreviewContext } from './FeaturePreviewContext'

// [Ivan] We should probably move this to a separate file, together with LOCAL_STORAGE_KEYS. We should make adding new feature previews as simple as possible.

const FEATURE_PREVIEWS = [
  // {
  //   key: LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT,
  //   name: 'Global navigation update',
  //   description: `Experience a redesigned and improved site navigation on the dashboard, with an intention to making finding your way around more intuitive and easier.`,
  // },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
    name: 'Project API documentation',
    description: `Get building with your client application faster with your Project's API documentation now available on any page across the dashboard.`,
  },
]

const FeaturePreviewModal = () => {
  const router = useRouter()
  const snap = useAppStateSnapshot()
  const telemetryProps = useTelemetryProps()
  const featurePreviewContext = useFeaturePreviewContext()
  const [selectedFeatureKey, setSelectedFeatureKey] = useState<string>(FEATURE_PREVIEWS[0].key)

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
      size="xlarge"
      header="Dashboard feature previews"
      visible={snap.showFeaturePreviewModal}
      onCancel={() => snap.setShowFeaturePreviewModal(false)}
    >
      <div className="flex">
        <div>
          <ScrollArea className="h-[400px] w-[240px] border-r">
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
        <div className="flex-grow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p>{selectedFeature?.name}</p>
            <Button type="default" onClick={() => toggleFeature()}>
              {isSelectedFeatureEnabled ? 'Disable' : 'Enable'} feature
            </Button>
          </div>
          <Markdown className="text-sm" content={selectedFeature?.description ?? ''} />
        </div>
      </div>
    </Modal>
  )
}

export default FeaturePreviewModal
