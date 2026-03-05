import type { PropsWithChildren } from 'react'

import { ProjectLayout } from 'components/layouts/ProjectLayout'
import { withAuth } from 'hooks/misc/withAuth'

import { IntegrationsProductMenu } from './IntegrationsProductMenu'

/**
 * Layout component for the Integrations section
 * Provides sidebar navigation for integrations
 */
const IntegrationsLayout = ({ children }: PropsWithChildren) => {
  return (
    <ProjectLayout
      title={'Integrations'}
      product="Integrations"
      isBlocking={false}
      productMenu={<IntegrationsProductMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

// Wrap component with authentication HOC before exporting
export default withAuth(IntegrationsLayout)
