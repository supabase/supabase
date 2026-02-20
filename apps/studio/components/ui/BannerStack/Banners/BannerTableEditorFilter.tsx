import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { Search } from 'lucide-react'
import { Badge, Button } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import {
  useFeaturePreviewModal,
  useIsTableFilterBarEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export const BannerTableEditorFilter = () => {
  const { ref } = useParams()
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const isTableFilterBarEnabled = useIsTableFilterBarEnabled()

  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABLE_EDITOR_NEW_FILTER_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const text = "name = 'John Doe'"

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('table-editor-new-filter-banner')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center mb-2">
            Preview
          </Badge>
          <div className="flex items-center gap-3 bg-surface-100 w-full border rounded-md px-1.5 py-1">
            <Search size={14} />
            <div className="bg-surface-200 border px-1.5 py-0.5 rounded">
              <p
                className="text-xs font-mono overflow-hidden whitespace-nowrap border-r-2 border-overlay"
                style={{
                  width: `${text.length}ch`,
                  animation: `typewriter 2s steps(${text.length}) forwards, blink-caret 0.75s step-end infinite`,
                }}
              >
                {text}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">New Table Filter Bar</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Build and modify complex filters visually
          </p>
        </div>
        <Button
          type="default"
          className="w-min"
          onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR)}
        >
          {isTableFilterBarEnabled ? 'View' : 'Enable'} feature preview
        </Button>
      </div>
    </BannerCard>
  )
}
