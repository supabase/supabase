import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { getTheme } from 'components/ui/CodeEditor'
import { useFlag } from 'hooks'
import { PropsWithChildren, useEffect } from 'react'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const monaco = useMonaco()
  const { theme } = useTheme()
  const ongoingIncident = useFlag('ongoingIncident')

  useEffect(() => {
    if (monaco && theme) {
      const mode: any = getTheme(theme)
      monaco.editor.defineTheme('supabase', mode)
    }
  }, [theme, monaco])

  return (
    <div className="min-h-full flex flex-col">
      {ongoingIncident && <IncidentBanner />}

      {children}
    </div>
  )
}

export default AppBannerWrapper
