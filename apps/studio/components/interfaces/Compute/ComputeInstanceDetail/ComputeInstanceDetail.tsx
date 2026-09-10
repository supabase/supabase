import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Container, Package } from 'lucide-react'
import Link from 'next/link'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  NavMenu,
  NavMenuItem,
} from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ComputeInstanceStatePill } from '../ComputeInstanceStatePill'
import { RuntimeBadge } from '../RuntimeBadge'
import { ComputeInstanceLogsTab } from './ComputeInstanceLogsTab'
import { ComputeInstanceOverviewTab } from './ComputeInstanceOverviewTab'
import { AlertError } from '@/components/ui/AlertError'
import type { ComputeInstanceLogStream } from '@/data/compute/compute-instance-logs-query'
import { computeInstanceQueryOptions } from '@/data/compute/compute-instance-query'
import { PRODUCT_NAME } from '@/lib/constants/compute'

type ComputeInstanceTab = 'overview' | 'invocations' | 'logs' | 'activity'
const COMPUTE_INSTANCE_TABS: ComputeInstanceTab[] = ['overview', 'invocations', 'logs', 'activity']

const TAB_LABEL: Record<ComputeInstanceTab, string> = {
  overview: 'Overview',
  invocations: 'Invocations',
  logs: 'Logs',
  activity: 'Activity',
}

const TAB_STREAM: Partial<Record<ComputeInstanceTab, ComputeInstanceLogStream>> = {
  invocations: 'requests',
  logs: 'output',
  activity: 'builds',
}

export const ComputeInstanceDetail = () => {
  const { ref: projectRef, name: instanceName } = useParams()

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<ComputeInstanceTab>(COMPUTE_INSTANCE_TABS)
      .withDefault('overview')
      .withOptions({ history: 'push' })
  )

  const {
    data: instance,
    error,
    isPending,
    isError,
  } = useQuery(computeInstanceQueryOptions({ projectRef, name: instanceName }))

  if (!projectRef) return null
  if (isPending) return <GenericSkeletonLoader className="p-6" />
  if (isError) return <AlertError error={error} subject="Failed to retrieve instance" />

  if (!instance) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm text-foreground-light">
          Instance "{instanceName}" does not exist in this project
        </p>
        <Button asChild variant="default">
          <Link href={`/project/${projectRef}/compute`}>Back to {PRODUCT_NAME}</Link>
        </Button>
      </div>
    )
  }

  const stream = TAB_STREAM[tab]

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/project/${projectRef}/compute`}>{PRODUCT_NAME}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{instance.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      <PageHeader className="py-4 [&>div]:px-4 [&>div]:xl:px-4">
        <PageHeaderMeta className="px-0 xl:px-0">
          <PageHeaderIcon>
            <Card className="flex h-14 w-14 shrink-0 items-center justify-center">
              <Container className="h-5 w-5" />
            </Card>
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>{instance.name}</PageHeaderTitle>
            <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <ComputeInstanceStatePill instance={instance} />
              <RuntimeBadge runtime={instance.runtime} />
              {instance.imageVersion !== undefined && (
                <span className="flex items-center gap-2 text-foreground-light">
                  <Package size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  Version {instance.imageVersion}
                </span>
              )}
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageNav>
        <NavMenu>
          {COMPUTE_INSTANCE_TABS.map((item) => (
            <NavMenuItem key={item} active={tab === item}>
              <button type="button" tabIndex={0} onClick={() => setTab(item)}>
                {TAB_LABEL[item]}
              </button>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>

      {tab === 'overview' && <ComputeInstanceOverviewTab instance={instance} />}
      {stream !== undefined && (
        <div className="flex flex-1 flex-col min-h-0">
          <ComputeInstanceLogsTab key={stream} instanceName={instance.name} stream={stream} />
        </div>
      )}
    </div>
  )
}
