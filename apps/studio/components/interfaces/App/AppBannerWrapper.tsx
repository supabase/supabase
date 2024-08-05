import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { PropsWithChildren, useMemo } from 'react'

import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { RestrictrionBanner } from 'components/layouts/AppLayout/RestrictionBanner'
import { getTheme } from 'components/ui/CodeEditor/CodeEditor.utils'
import { useFlag } from 'hooks/ui/useFlag'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const monaco = useMonaco()
  const { resolvedTheme } = useTheme()

  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')

  // Define the supabase theme for Monaco before anything is rendered. Using useEffect would sometime load the theme
  // after the editor was loaded, so it looked off. useMemo will always be run before rendering
  useMemo(() => {
    if (monaco && resolvedTheme) {
      const mode: any = getTheme(resolvedTheme)
      monaco.editor.defineTheme('supabase', mode)
    }
  }, [resolvedTheme, monaco])

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-none">
        {ongoingIncident && <IncidentBanner />}
        {showNoticeBanner && <NoticeBanner />}
        <RestrictrionBanner />
      </div>
      {children}
    </div>
  )
}

export default AppBannerWrapper
