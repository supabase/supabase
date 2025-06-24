import { PropsWithChildren } from 'react'

import ProjectLayout from '../ProjectLayout/ProjectLayout'

const UnifiedLogsLayout = ({ children }: PropsWithChildren) => {
  return <ProjectLayout>{children}</ProjectLayout>
}

export default UnifiedLogsLayout
