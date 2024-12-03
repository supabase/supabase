import { ExternalLink, Eye, EyeOff, FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useFlag } from 'hooks/ui/useFlag'
import { TELEMETRY_EVENTS } from 'lib/constants/telemetry'
import { useAppStateSnapshot } from 'state/app-state'
import { Badge, Button, Modal, ScrollArea, cn } from 'ui'
import { FEATURE_PREVIEWS, useFeaturePreviewContext } from './FeaturePreviewContext'

const FeaturePreviewModal = () => {
  const snap = useAppStateSnapshot()
  const featurePreviewContext = useFeaturePreviewContext()
  const { mutate: sendEvent } = useSendEventMutation()
  const enableFunctionsAssistant = useFlag('functionsAssistantV2')

  const selectedFeaturePreview =
    snap.selectedFeaturePreview === '' ? FEATURE_PREVIEWS[0].key : snap.selectedFeaturePreview

  const [selectedFeatureKey, setSelectedFeatureKey] = useState<string>(selectedFeaturePreview)
  const isNotReleased =
    selectedFeatureKey === 'supabase-ui-functions-assistant' && !enableFunctionsAssistant

  // this modal can be triggered on other pages
  // Update local state when valtio state changes
  useEffect(() => {
    if (snap.selectedFeaturePreview !== '') {
      setSelectedFeatureKey(snap.selectedFeaturePreview)
    }
  }, [snap.selectedFeaturePreview])

  const { flags, onUpdateFlag } = featurePreviewContext
  const selectedFeature = FEATURE_PREVIEWS.find((preview) => preview.key === selectedFeatureKey)
  const isSelectedFeatureEnabled = flags[selectedFeatureKey]

  const toggleFeature = () => {
    onUpdateFlag(selectedFeatureKey, !isSelectedFeatureEnabled)
    sendEvent({
      action: TELEMETRY_EVENTS.FEATURE_PREVIEWS,
      label: selectedFeatureKey,
      value: isSelectedFeatureEnabled ? 'disabled' : 'enabled',
    })
  }

  function handleCloseFeaturePreviewModal() {
    snap.setShowFeaturePreviewModal(false)
    snap.setSelectedFeaturePreview(FEATURE_PREVIEWS[0].key)
  }

  return (
    <Modal
      hideFooter
      showCloseButton
      size="xlarge"
      className="max-w-4xl"
      header="Dashboard feature previews"
      visible={snap.showFeaturePreviewModal}
      onCancel={handleCloseFeaturePreviewModal}
    >
      {FEATURE_PREVIEWS.length > 0 ? (
        <div className="flex">
          <div>
            <ScrollArea className="h-[550px] w-[280px] border-r">
              {FEATURE_PREVIEWS.map((feature) => {
                const isEnabled = flags[feature.key] ?? false

                return (
                  <div
                    key={feature.key}
                    onClick={() => setSelectedFeatureKey(feature.key)}
                    className={cn(
                      'flex items-center space-x-3 p-4 border-b cursor-pointer bg transition',
                      selectedFeatureKey === feature.key ? 'bg-surface-300' : 'bg-surface-100'
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
                {selectedFeature?.isNew && <Badge color="green">New</Badge>}
              </div>
              <div className="flex items-center gap-x-2">
                {selectedFeature?.discussionsUrl !== undefined && (
                  <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                    <Link href={selectedFeature.discussionsUrl} target="_blank" rel="noreferrer">
                      Give feedback
                    </Link>
                  </Button>
                )}
                {isNotReleased ? (
                  <Button disabled type="default">
                    Coming soon
                  </Button>
                ) : (
                  <Button type="default" onClick={() => toggleFeature()}>
                    {isSelectedFeatureEnabled ? 'Disable' : 'Enable'} feature
                  </Button>
                )}
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
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
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
