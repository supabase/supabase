import { useParams } from 'common'
import { Check, ExternalLink, FlaskConical, Square } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { useLatest } from 'react-use'
import { toast } from 'sonner'
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
import {
  FeaturePreview,
  useVisibleFeaturePreviewsByCategory,
} from '@/components/interfaces/App/FeaturePreview/useFeaturePreviews'
import { useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'

const FEATURE_PREVIEWS_PAGE_NAME = 'Feature previews'

export function useFeaturePreviewCommands() {
  const router = useRouter()
  const { ref } = useParams()
  const { dismissBanner } = useBannerStack()
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
  // must not kick the user back to the root menu. Same reasoning applies to
  // `ref`/`pathname`: the command's `action` closure is only recreated when
  // `previewsByCategory` changes identity, so without reading these through a
  // ref too, navigating between projects (or to/from the org view) after that
  // page was first registered would keep routing to whatever project was
  // current back then.
  const flagsRef = useLatest(flags)
  const routeContextRef = useLatest({ ref, pathname: router.pathname })

  // Mirrors FeaturePreviewModal's toggleFeature: if the preview has a route to
  // try it out in, enabling it takes the user there instead of just flipping
  // the flag silently.
  const toggleFeaturePreview = (preview: FeaturePreview) => {
    if (preview.isForced) return

    const isEnabling = !flagsRef.current[preview.key]
    onUpdateFlag(preview.key, isEnabling)

    if (!isEnabling) {
      toast(`${preview.name} disabled`)
      return
    }

    // Only route into a project when actually on a project-scoped page —
    // `ref` alone isn't enough, since it can retain a stale value after
    // client-side navigating to a route without a `ref` segment (e.g. the org
    // view).
    const { ref: currentRef, pathname } = routeContextRef.current
    const isProjectScopedRoute = pathname.startsWith('/project/')
    const route = isProjectScopedRoute ? preview.getRoute?.(currentRef) : undefined
    if (route !== undefined && currentRef !== undefined) {
      setIsOpen(false)
      router.push(route)
      toast.success(`${preview.name} enabled`, {
        description: "We've taken you to where you can try it out.",
      })
      if (preview.bannerId) dismissBanner(preview.bannerId)
    } else {
      toast.success(`${preview.name} enabled`, {
        description: "It's now active across the dashboard.",
      })
    }
  }

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
              action: () => toggleFeaturePreview(preview),
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
