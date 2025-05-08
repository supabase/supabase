import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { Sparkles } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { Separator } from 'ui'

import { useParams } from 'common'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()

  const navigationItems = [
    {
      label: 'API Keys',
      href: `/project/${projectRef}/settings/api-keys`,
      id: 'legacy-keys',
    },
    {
      label: 'New API Keys (Coming Soon)',
      href: `/project/${projectRef}/settings/api-keys/new`,
      id: 'new-keys',
    },
  ]

  return (
    <PageLayout
      title="API Keys"
      subtitle="Configure API keys that help secure your project"
      navigationItems={navigationItems}
    >
      <ScaffoldContainer className="flex flex-col gap-0 py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default ApiKeysLayout
