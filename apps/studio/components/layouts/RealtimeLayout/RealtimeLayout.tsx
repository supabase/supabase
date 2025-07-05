import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

export interface RealtimeLayoutProps {
  title: string
}

const RealtimeLayout = ({ title, children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const project = useSelectedProject()
  // the flag is used to enable/disable the realtime settings for all projects
  const enableRealtimeSettingsFlag = useFlag('enableRealtimeSettings')
  // the flag is used to enable/disable the realtime settings for specific projects. Will be overridden by the enableRealtimeSettingsFlag if it is enabled.
  const approvedProjects = useFlag<string>('isRealtimeSettingsEnabledOnProjects')

  const isEnabledOnProject =
    !!project?.ref &&
    typeof approvedProjects === 'string' &&
    (approvedProjects ?? '')
      .split(',')
      .map((it) => it.trim())
      .includes(project?.ref)

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title}
      product="Realtime"
      productMenu={
        <ProductMenu
          page={page}
          menu={generateRealtimeMenu(project!, {
            enableRealtimeSettings: enableRealtimeSettingsFlag || isEnabledOnProject,
          })}
        />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
