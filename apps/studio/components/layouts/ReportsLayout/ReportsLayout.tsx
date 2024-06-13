import { PropsWithChildren } from 'react'
import { withAuth } from 'hooks'
import { ProjectLayout } from '../'
import ReportsMenu from './ReportsMenu'

interface ReportsLayoutProps {
  title?: string
}

const ReportsLayout = ({ title, children }: PropsWithChildren<ReportsLayoutProps>) => {
  return (
    <ProjectLayout title={title} product="Reports" productMenu={<ReportsMenu />} isBlocking={false}>
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(ReportsLayout)
