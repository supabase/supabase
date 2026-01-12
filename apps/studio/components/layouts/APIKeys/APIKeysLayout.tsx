import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()

  const navigationItems = [
    {
      label: 'Publishable and secret API keys',
      href: `/project/${projectRef}/settings/api-keys`,
      id: 'new-keys',
    },
    {
      label: 'Legacy anon, service_role API keys',
      href: `/project/${projectRef}/settings/api-keys/legacy`,
      id: 'legacy-keys',
    },
  ]

  return (
    <PageLayout
      title="API Keys"
      subtitle="Configure API keys to securely control access to your project"
      navigationItems={navigationItems}
      secondaryActions={<DocsButton href={`${DOCS_URL}/guides/api/api-keys`} />}
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default ApiKeysLayout
