import { useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { generateBranchMenu } from './BranchLayout.utils'
import { GitHubStatus } from '@/components/interfaces/Settings/Integrations/GithubIntegration/GitHubStatus'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { withAuth } from '@/hooks/misc/withAuth'

const BranchProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()
  const page = router.pathname.split('/')[4] ?? 'branches'

  return (
    <>
      <ProductMenu page={page} menu={generateBranchMenu(projectRef)} />
      <div className="px-6">
        <h3 className="text-sm font-mono text-foreground-lighter uppercase mb-3">Configure</h3>
        <GitHubStatus />
      </div>
    </>
  )
}

const BranchLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout product="Branching" productMenu={<BranchProductMenu />} isBlocking={false}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(BranchLayout)
