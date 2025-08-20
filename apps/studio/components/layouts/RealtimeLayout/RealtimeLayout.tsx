import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useIsRealtimeSettingsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useIsRealtimeSettingsFFEnabled } from 'hooks/ui/useFlag'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

export interface RealtimeLayoutProps {
  title: string
}

const RealtimeLayout = ({ title, children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const { data: project } = useSelectedProjectQuery()
  const enableRealtimeSettingsFF = useIsRealtimeSettingsFFEnabled()
  const enableRealtimeSettingsFP = useIsRealtimeSettingsEnabled()
  const showPolicies = useIsFeatureEnabled('authentication:policies')

  const enableRealtimeSettings = enableRealtimeSettingsFF && enableRealtimeSettingsFP

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title}
      product="Realtime"
      productMenu={
        <ProductMenu
          page={page}
          menu={generateRealtimeMenu(project!, { enableRealtimeSettings, showPolicies })}
        />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
