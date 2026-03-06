import Link from 'next/link'
import { ReactNode } from 'react'

import { DocsButton } from 'components/ui/DocsButton'
import {
  Badge,
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  Button,
} from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

interface PlatformWebhooksHeaderProps {
  hasSelectedEndpoint: boolean
  headerTitle: string
  headerDescription: string
  endpointStatus?: 'enabled' | 'disabled'
  endpointActions?: ReactNode
  webhooksHref: string
  scopeLabel: string
}

export const PlatformWebhooksHeader = ({
  hasSelectedEndpoint,
  headerTitle,
  headerDescription,
  endpointStatus,
  endpointActions,
  webhooksHref,
  scopeLabel,
}: PlatformWebhooksHeaderProps) => {
  return (
    <PageHeader size="default" className="pb-6">
      {hasSelectedEndpoint && (
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={webhooksHref}>{scopeLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Endpoint</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>
      )}
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>
            <span className="inline-flex items-center gap-2">
              <span>{headerTitle}</span>
              {hasSelectedEndpoint && endpointStatus && (
                <Badge variant={endpointStatus === 'enabled' ? 'success' : 'default'}>
                  {endpointStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                </Badge>
              )}
            </span>
          </PageHeaderTitle>
          <PageHeaderDescription>{headerDescription}</PageHeaderDescription>
        </PageHeaderSummary>
        <PageHeaderAside>
          {hasSelectedEndpoint ? (
            endpointActions
          ) : (
            <>
              <DocsButton href="https://supabase.com/docs" />
              <Button asChild type="default">
                <a target="_blank" rel="noopener noreferrer" href="https://supabase.com">
                  Leave feedback
                </a>
              </Button>
            </>
          )}
        </PageHeaderAside>
      </PageHeaderMeta>
    </PageHeader>
  )
}
