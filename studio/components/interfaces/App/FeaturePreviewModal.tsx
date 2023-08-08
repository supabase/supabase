import { Button, IconEye, IconEyeOff, Modal, ScrollArea } from 'ui'
import { useState } from 'react'

import { useAppUiStateSnapshot } from 'state/app'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useFeaturePreviewContext } from './FeaturePreviewContext'

const FEATURE_PREVIEWS = [
  {
    key: 'navigation',
    name: 'Global navigation update',
    description:
      'Experience a redesigned and improved site navigation on the dashboard, with an intention to making finding your way around more intuitive and easier.',
  },
]

const FeaturePreviewModal = () => {
  const snap = useAppUiStateSnapshot()
  const featurePreviewContext = useFeaturePreviewContext()
  const [selectedFeatureKey, setSelectedFeatureKey] = useState<string>('navigation')

  const { flags, onUpdateFlag } = featurePreviewContext
  const isEnabledNavigationPreview = flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT]

  const selectedFeature = FEATURE_PREVIEWS.find((preview) => preview.key === selectedFeatureKey)
  const isSelectedFeatureEnabled = selectedFeatureKey === 'navigation' && isEnabledNavigationPreview

  const enableFeature = () => {
    switch (selectedFeatureKey) {
      case 'navigation':
        onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT, !isEnabledNavigationPreview)
        break
      default:
        break
    }
  }

  return (
    <Modal
      hideFooter
      size="xlarge"
      header="Dashboard feature preview"
      visible={snap.showFeaturePreviewModal}
      onCancel={() => snap.setShowFeaturePreviewModal(false)}
    >
      <div className="flex">
        <div>
          <ScrollArea className="h-[400px] w-[240px] border-r">
            {FEATURE_PREVIEWS.map((feature) => {
              const isEnabled = feature.key === 'navigation' ? isEnabledNavigationPreview : false
              return (
                <div
                  key={feature.key}
                  onClick={() => setSelectedFeatureKey(feature.key)}
                  className="flex items-center space-x-3 p-4 border-b cursor-pointer bg-surface-100 hover:bg-surface-200"
                >
                  {isEnabled ? (
                    <IconEye size={14} strokeWidth={2} className="text-brand" />
                  ) : (
                    <IconEyeOff size={14} strokeWidth={1.5} className="text-light" />
                  )}
                  <p className="text-sm">{feature.name}</p>
                </div>
              )
            })}
          </ScrollArea>
        </div>
        <div className="flex-grow p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p>{selectedFeature?.name}</p>
            <Button type="default" onClick={() => enableFeature()}>
              {isSelectedFeatureEnabled ? 'Disable' : 'Enable'} feature
            </Button>
          </div>
          <p className="text-sm">{selectedFeature?.description}</p>
        </div>
      </div>
    </Modal>
  )
}

export default FeaturePreviewModal
