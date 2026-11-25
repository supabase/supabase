import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { CircleHelpIcon, XIcon } from 'lucide-react'
import { Badge, Button } from 'ui'

import { ButtonTooltip } from '../../../ui/ButtonTooltip'
import {
  useFeaturePreviewContext,
  useFeaturePreviewModal,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const StorageVersioningPreviewBanner = () => {
  const { ref } = useParams()
  const { flags, isInitialized, onUpdateFlag } = useFeaturePreviewContext()
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const isStorageVersioningAvailable = useFlag('storageVersioningPrivateAlpha')
  const { data } = useProjectStorageConfigQuery({ projectRef: ref })
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.STORAGE_VERSIONING_PREVIEW_BANNER_DISMISSED(ref ?? '_'),
    false
  )

  const isPreviewEnabled = flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING] === true
  const canShowBanner =
    isInitialized &&
    isStorageVersioningAvailable &&
    !!data?.capabilities?.object_versioning &&
    !isDismissed

  if (!canShowBanner) return null

  return (
    <div className="mx-3 mb-4 mt-auto space-y-3 rounded-lg border p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="success">New</Badge>
          <Badge variant="warning">Public Alpha</Badge>
        </div>
        <Button
          variant="text"
          size="tiny"
          icon={<XIcon size={14} strokeWidth={1.5} />}
          onClick={() => setIsDismissed(true)}
          className="-mt-1 -mr-1 px-1 opacity-75 hover:opacity-100"
          aria-label="Dismiss object versioning announcement"
        />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm">Introducing Object Versioning and Lifecycle Policies</h4>
        <p className="text-xs text-foreground-lighter">
          Preserve and restore versions of files in your buckets, and automatically expire
          noncurrent versions with lifecycle policies.
        </p>
      </div>
      <div className="flex justify-start items-start gap-x-2">
        {isPreviewEnabled ? (
          <Button
            size="tiny"
            onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING)}
          >
            Review feature
          </Button>
        ) : (
          <Button
            size="tiny"
            variant="primary"
            onClick={() => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING, true)}
          >
            Enable
          </Button>
        )}
        {!isPreviewEnabled && (
          <ButtonTooltip
            className="px-1.5"
            icon={<CircleHelpIcon />}
            onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING)}
            tooltip={{ content: { side: 'bottom', text: 'More information' } }}
          />
        )}
      </div>
    </div>
  )
}
