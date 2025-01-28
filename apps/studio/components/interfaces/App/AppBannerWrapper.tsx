import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { PropsWithChildren, useMemo } from 'react'

import { ClockSkewBanner } from 'components/layouts/AppLayout/ClockSkewBanner'
import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { RestrictionBanner } from 'components/layouts/AppLayout/RestrictionBanner'
import { getTheme } from 'components/ui/CodeEditor/CodeEditor.utils'
import { useFlag } from 'hooks/ui/useFlag'
import { useProfile } from 'lib/profile'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const monaco = useMonaco()
  const { profile } = useProfile()
  const { resolvedTheme } = useTheme()

  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  // Define the supabase theme for Monaco before anything is rendered. Using useEffect would sometime load the theme
  // after the editor was loaded, so it looked off. useMemo will always be run before rendering
  useMemo(() => {
    if (monaco && resolvedTheme) {
      const mode: any = getTheme(resolvedTheme)
      monaco.editor.defineTheme('supabase', mode)
    }
  }, [resolvedTheme, monaco])

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-none">
        {ongoingIncident && <IncidentBanner />}
        {showNoticeBanner && <NoticeBanner />}
        {profile !== undefined && <RestrictionBanner />}
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}

export default AppBannerWrapper
