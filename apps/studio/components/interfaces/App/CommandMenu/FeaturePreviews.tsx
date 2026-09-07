import { Check, ExternalLink, FlaskConical, Square } from 'lucide-react'
import { useMemo } from 'react'
import { useLatest } from 'react-use'
import { Badge } from 'ui'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
} from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import {
  useFeaturePreviewContext,
  useFeaturePreviewModal,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useVisibleFeaturePreviewsByCategory } from '@/components/interfaces/App/FeaturePreview/useFeaturePreviews'

const FEATURE_PREVIEWS_PAGE_NAME = 'Feature previews'

export function useFeaturePreviewCommands() {
  const setPage = useSetPage()
  const setIsOpen = useSetCommandMenuOpen()
  const { flags, onUpdateFlag } = useFeaturePreviewContext()
  const { selectFeaturePreview, toggleFeaturePreviewModal } = useFeaturePreviewModal()

  const openFeaturePreviewDetails = (key: string) => {
    selectFeaturePreview(key)
    toggleFeaturePreviewModal(true)
    setIsOpen(false)
  }

  // Registering this page tears it down and re-adds it (popping it off the
  // page stack if it's currently open) whenever `deps` changes identity, so
  // `flags` is read through a ref instead of being a dep — toggling a preview
  // must not kick the user back to the root menu.
  const flagsRef = useLatest(flags)

  // Grouped identically to the feature preview modal's category accordion —
  // shared hook, so the two can never list a different set of previews.
  const previewsByCategory = useVisibleFeaturePreviewsByCategory()

  const visiblePreviews = useMemo(
    () => previewsByCategory.flatMap(({ previews }) => previews),
    [previewsByCategory]
  )

  useRegisterPage(
    FEATURE_PREVIEWS_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: previewsByCategory
        .filter(({ previews }) => previews.length > 0)
        .map(({ category, previews }) => ({
          id: `feature-previews-${category ?? 'others'}`,
          name: category ?? 'Others',
          commands: previews.flatMap((preview) => [
            {
              id: `feature-preview-${preview.key}`,
              name: preview.name,
              value: preview.isForced
                ? `${preview.name}, Feature preview, now the default, can't be turned off`
                : `${preview.name}, Feature preview, Toggle ${preview.name}`,
              action: () => {
                if (!preview.isForced) onUpdateFlag(preview.key, !flagsRef.current[preview.key])
              },
              icon: () => (flagsRef.current[preview.key] ? <Check /> : <Square />),
              badge: preview.isForced
                ? () => (
                    <Badge
                      variant="default"
                      title="This feature is now the default and can no longer be turned off"
                    >
                      Default
                    </Badge>
                  )
                : preview.isNew
                  ? () => <Badge variant="success">New</Badge>
                  : undefined,
            },
            {
              id: `feature-preview-${preview.key}-details`,
              name: `${preview.name}: View details`,
              value: `${preview.name}, About, Learn more, Description, Feedback, Discussion`,
              action: () => openFeaturePreviewDetails(preview.key),
              icon: () => <ExternalLink />,
              defaultHidden: true,
            },
          ]),
        })),
    },
    { deps: [previewsByCategory], enabled: visiblePreviews.length > 0 }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'feature-previews',
        name: 'Feature previews...',
        value: 'Feature previews, Try new features, Early access, Opt in, Opt out, Beta features',
        action: () => setPage(FEATURE_PREVIEWS_PAGE_NAME),
        icon: () => <FlaskConical />,
      },
    ],
    { enabled: visiblePreviews.length > 0 }
  )
}
