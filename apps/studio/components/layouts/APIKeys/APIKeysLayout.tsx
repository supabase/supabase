import { PropsWithChildren } from 'react'

import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from '@/components/layouts/Scaffold'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  return (
    <PageLayout
      title="API Keys"
      subtitle="Configure API keys to securely control access to your project"
      secondaryActions={<DocsButton href={`${DOCS_URL}/guides/api/api-keys`} />}
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default ApiKeysLayout
