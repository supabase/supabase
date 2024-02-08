import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { PropsWithChildren, useEffect } from 'react'

import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { getTheme } from 'components/ui/CodeEditor'
import { useFlag } from 'hooks'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const monaco = useMonaco()
  const { resolvedTheme } = useTheme()

  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')

  useEffect(() => {
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
      </div>
      {children}
    </div>
  )
}

export default AppBannerWrapper
