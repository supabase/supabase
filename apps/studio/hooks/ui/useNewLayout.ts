import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

export const useNewLayout = (): boolean => {
  const featurePreviewContext = useFeaturePreviewContext()
  const { flags } = featurePreviewContext
  const newLayoutPreview = flags[LOCAL_STORAGE_KEYS.UI_NEW_LAYOUT_PREVIEW]

  return newLayoutPreview
}
