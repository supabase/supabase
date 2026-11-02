import { useParams } from 'common'
import Link from 'next/link'
import { ReactNode } from 'react'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, cn } from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { PRODUCT_NAME } from '@/lib/constants/compute'

// Widths roughly follow the Overview, Invocations, Logs and Activity tab labels
const TAB_WIDTHS = ['w-16', 'w-20', 'w-8', 'w-14']
// Widths roughly follow the Instances, Live, Ready and Stale counts
const INSTANCE_COUNT_WIDTHS = ['w-20', 'w-10', 'w-12', 'w-12']
// Label and value widths for the Runtime, Version, Base image, Entrypoint and Listening port rows
const CONTAINER_ROW_WIDTHS: [string, string][] = [
  ['w-16', 'w-16'],
  ['w-14', 'w-12'],
  ['w-20', 'w-40'],
  ['w-20', 'w-32'],
  ['w-24', 'w-24'],
]
// Label and value widths for the Size, Instances, Access and Region rows
const RESOURCE_ROW_WIDTHS: [string, string][] = [
  ['w-10', 'w-24'],
  ['w-16', 'w-6'],
  ['w-14', 'w-14'],
  ['w-14', 'w-36'],
]

const TextLoader = ({ className, height = 'h-5' }: { className: string; height?: string }) => (
  <span className={cn('flex min-w-0 items-center', height)}>
    <ShimmeringLoader className={cn('h-4 max-w-full py-0', className)} />
  </span>
)

interface ComputeInstanceDetailSkeletonProps {
  children: ReactNode
}

/**
 * Mirrors the breadcrumbs, header and tabs of `ComputeInstanceDetail` while the instance loads.
 * Pass the placeholder for the active tab as children.
 */
export const ComputeInstanceDetailSkeleton = ({ children }: ComputeInstanceDetailSkeletonProps) => {
  const { ref: projectRef } = useParams()

  return (
    <div aria-busy="true" className="w-full min-h-full flex flex-col items-stretch">
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/project/${projectRef}/compute`}>{PRODUCT_NAME}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <ShimmeringLoader className="h-4 w-24 py-0" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      <PageHeader className="py-4 [&>div]:px-4 [&>div]:xl:px-4">
        <PageHeaderMeta className="px-0 xl:px-0">
          <PageHeaderIcon>
            <ShimmeringLoader className="h-14 w-14 rounded-lg py-0" />
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>
              <span className="sr-only">Loading instance</span>
              <TextLoader height="h-8" className="h-6 w-48" />
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <TextLoader className="w-16" />
              <TextLoader className="w-14" />
              <TextLoader className="w-24" />
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageNav>
        <div className="flex h-(--header-height) items-center gap-5">
          {TAB_WIDTHS.map((width, index) => (
            <ShimmeringLoader key={width} className={cn('h-4 py-0', width)} delayIndex={index} />
          ))}
        </div>
      </PageNav>

      {children}
    </div>
  )
}

const SettingsRowSkeleton = ({
  labelWidth,
  valueWidth,
  isFirst,
}: {
  labelWidth: string
  valueWidth: string
  isFirst?: boolean
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 px-4 py-3',
      !isFirst && 'border-t border-default'
    )}
  >
    <TextLoader className={labelWidth} />
    <TextLoader className={valueWidth} />
  </div>
)

/**
 * Mirrors the Instances, Container and Resources sections of `ComputeInstanceOverviewTab`.
 */
export const ComputeInstanceOverviewTabSkeleton = () => (
  <PageContainer size="small">
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Instances</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="space-y-3">
          <TextLoader className="w-36" />
          <div className="grid grid-cols-2 divide-x divide-y rounded-md border border-default bg-surface-100 sm:grid-cols-4 sm:divide-y-0">
            {INSTANCE_COUNT_WIDTHS.map((width, index) => (
              <div key={index} className="flex flex-col gap-1 px-5 py-4">
                <TextLoader className={width} />
                <TextLoader height="h-8" className="h-6 w-8" />
              </div>
            ))}
          </div>
        </div>
      </PageSectionContent>
    </PageSection>

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Container</PageSectionTitle>
          <PageSectionDescription>
            The runtime image and entrypoint resolved for this instance.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="rounded-md border border-default bg-surface-100">
          {CONTAINER_ROW_WIDTHS.map(([labelWidth, valueWidth], index) => (
            <SettingsRowSkeleton
              key={index}
              labelWidth={labelWidth}
              valueWidth={valueWidth}
              isFirst={index === 0}
            />
          ))}
        </div>
      </PageSectionContent>
    </PageSection>

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Resources</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="rounded-md border border-default bg-surface-100">
          {RESOURCE_ROW_WIDTHS.map(([labelWidth, valueWidth], index) => (
            <SettingsRowSkeleton
              key={index}
              labelWidth={labelWidth}
              valueWidth={valueWidth}
              isFirst={index === 0}
            />
          ))}
        </div>
      </PageSectionContent>
    </PageSection>
  </PageContainer>
)
