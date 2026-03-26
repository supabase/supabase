import { DocsButton } from 'components/ui/DocsButton'
import Link from 'next/link'
import { ReactNode } from 'react'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
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
import { StateBadge } from 'ui-patterns/StateBadge'

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
        <PageHeaderSummary className="min-w-0">
          <PageHeaderTitle className="min-w-0 w-full">
            <span className="flex w-full min-w-0 items-center gap-2">
              <span className="block min-w-0 truncate leading-tight">{headerTitle}</span>
              {hasSelectedEndpoint && endpointStatus && (
                <StateBadge className="shrink-0 self-center" state={endpointStatus} />
              )}
            </span>
          </PageHeaderTitle>
          <PageHeaderDescription>{headerDescription}</PageHeaderDescription>
        </PageHeaderSummary>
        <PageHeaderAside>
          {hasSelectedEndpoint ? endpointActions : <DocsButton href="https://supabase.com/docs" />}
        </PageHeaderAside>
      </PageHeaderMeta>
    </PageHeader>
  )
}
