import { PropsWithChildren } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

export const AccessTokensLayout = ({ children }: PropsWithChildren) => {
  const title = 'Access Tokens'
  const description = 'Create and manage access tokens for API authentication.'

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{title}</PageHeaderTitle>
            <PageHeaderDescription>{description}</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small" className="pt-8 pb-16">
        {children}
      </PageContainer>
    </>
  )
}
