import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'common'
import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { getTheme } from 'components/ui/CodeEditor'
import { useFlag } from 'hooks'
import { PropsWithChildren, useEffect } from 'react'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const monaco = useMonaco()
  const { isDarkMode } = useTheme()
  const ongoingIncident = useFlag('ongoingIncident')

  useEffect(() => {
    if (monaco) {
      const theme: any = getTheme(isDarkMode)
      monaco.editor.defineTheme('supabase', theme)
    }
  }, [isDarkMode, monaco])

  return (
    <div className="min-h-full flex flex-col">
      {ongoingIncident && <IncidentBanner />}

      {children}
    </div>
  )
}

export default AppBannerWrapper
