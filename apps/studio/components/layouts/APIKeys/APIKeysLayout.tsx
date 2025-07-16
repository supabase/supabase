import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()

  const navigationItems = [
    {
      label: 'Legacy API Keys',
      href: `/project/${projectRef}/settings/api-keys`,
      id: 'legacy-keys',
    },
    {
      label: 'API Keys',
      href: `/project/${projectRef}/settings/api-keys/new`,
      id: 'new-keys',
    },
  ]

  return (
    <PageLayout
      title="API Keys"
      subtitle="Configure API keys to securely control access to your project"
      navigationItems={navigationItems}
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default ApiKeysLayout
