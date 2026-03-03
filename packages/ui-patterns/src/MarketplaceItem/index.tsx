import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn, NavMenu, NavMenuItem } from 'ui'

import { PageContainer } from '../PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from '../PageHeader'
import { PageSection, PageSectionContent } from '../PageSection'
import { MarketplaceItemFilesGallery } from './files-gallery'

export type MarketplaceItemFile = {
  id?: string | number
  name: string
  href?: string
  description?: string
}

export type MarketplaceItemMetaField = {
  label: string
  value: ReactNode
}

export type MarketplaceItemTab = {
  label: string
  href?: string
  active?: boolean
}

export type MarketplaceItemProps = {
  title: string
  summary?: string | null
  content?: string | null
  files?: MarketplaceItemFile[]
  partnerName?: string
  lastUpdatedAt?: string | Date | null
  type?: string | null
  metaFields?: MarketplaceItemMetaField[]
  tabs?: MarketplaceItemTab[]
  className?: string
}

function formatLastUpdated(value: string | Date | null | undefined) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

export function MarketplaceItem({
  title,
  summary,
  content,
  files = [],
  partnerName,
  lastUpdatedAt,
  type,
  metaFields,
  tabs = [],
  className,
}: MarketplaceItemProps) {
  const defaultMetaFields: MarketplaceItemMetaField[] = [
    {
      label: 'Partner',
      value: partnerName ?? 'Unknown partner',
    },
    {
      label: 'Last updated',
      value: formatLastUpdated(lastUpdatedAt) ?? 'Unknown',
    },
    {
      label: 'Type',
      value: type ?? 'Unknown',
    },
  ]

  const resolvedMetaFields = metaFields ? [...defaultMetaFields, ...metaFields] : defaultMetaFields
  const hasCustomActiveTab = tabs.some((tab) => tab.active)
  const resolvedTabs: MarketplaceItemTab[] = [
    {
      label: 'Overview',
      active: !hasCustomActiveTab,
    },
    ...tabs.map((tab) => ({
      ...tab,
      active: tab.active ?? false,
    })),
  ]
  const hasContent = Boolean(content && content.trim())

  return (
    <div className={cn('w-full', className)}>
      <PageHeader size="full">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{title}</PageHeaderTitle>
            <PageHeaderDescription>{summary || 'No summary provided.'}</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
        <PageHeaderNavigationTabs>
          <NavMenu>
            {resolvedTabs.map((tab, index) => (
              <NavMenuItem key={`${tab.label}-${index}`} active={tab.active ?? false}>
                {tab.href ? (
                  <a href={tab.href} className="inline-flex">
                    {tab.label}
                  </a>
                ) : (
                  <span className="inline-flex">{tab.label}</span>
                )}
              </NavMenuItem>
            ))}
          </NavMenu>
        </PageHeaderNavigationTabs>
      </PageHeader>

      <PageSection>
        <PageSectionContent>
          <PageContainer size="full">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
              <div className="space-y-8">
                <section className="space-y-3">
                  <MarketplaceItemFilesGallery files={files} />
                </section>

                <section className="space-y-3">
                  {hasContent ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className={cn(
                        'text-foreground-light space-y-4',
                        'text-sm leading-6',
                        '[&_a]:underline [&_a]:underline-offset-2',
                        '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5',
                        '[&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3',
                        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
                        '[&_h1]:text-subSection [&_h1]:text-foreground [&_h2]:text-subSection [&_h2]:text-foreground [&_h3]:text-default [&_h3]:text-foreground [&_h4]:text-default [&_h4]:text-foreground [&_h5]:text-default [&_h5]:text-foreground [&_h6]:text-subSection [&_h6]:text-foreground'
                      )}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <div className="space-y-3" aria-hidden="true">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-[94%] rounded bg-muted" />
                      <div className="h-4 w-[82%] rounded bg-muted" />
                      <div className="h-4 w-[97%] rounded bg-muted" />
                      <div className="h-4 w-[76%] rounded bg-muted" />
                      <div className="h-4 w-[88%] rounded bg-muted" />
                    </div>
                  )}
                </section>
              </div>

              <aside>
                <dl className="space-y-4">
                  {resolvedMetaFields.map((field, index) => (
                    <div key={`${field.label}-${index}`}>
                      <dt className="heading-meta text-foreground-lighter">{field.label}</dt>
                      <dd className="text-sm">{field.value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>
          </PageContainer>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
