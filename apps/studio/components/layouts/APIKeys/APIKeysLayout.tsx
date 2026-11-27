import { PropsWithChildren } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>API Keys</PageHeaderTitle>
            <PageHeaderDescription>
              Configure API keys to securely control access to your project
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/api/api-keys`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer className="flex flex-col py-8 pb-16 gap-8">{children}</PageContainer>
    </>
  )
}

export default ApiKeysLayout
