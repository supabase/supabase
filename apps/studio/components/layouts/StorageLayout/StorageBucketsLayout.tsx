import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import { useStorageV2Page } from 'components/interfaces/Storage/Storage.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { usePathname } from 'next/navigation'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

export const StorageBucketsLayout = ({
  title,
  hideSubtitle = false,
  children,
}: PropsWithChildren<{ title?: string; hideSubtitle?: boolean }>) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const page = useStorageV2Page()
  const config = !!page && page !== 's3' ? BUCKET_TYPES[page] : undefined

  const navigationItems =
    page === 'files'
      ? [
          {
            label: 'Buckets',
            href: `/project/${ref}/storage/files`,
          },
          {
            label: 'Settings',
            href: `/project/${ref}/storage/files/settings`,
          },
          {
            label: 'Policies',
            href: `/project/${ref}/storage/files/policies`,
          },
        ]
      : []

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{title || (config?.displayName ?? 'Storage')}</PageHeaderTitle>
            {!hideSubtitle && (
              <PageHeaderDescription>
                {config?.description || 'Manage your storage buckets and files.'}
              </PageHeaderDescription>
            )}
          </PageHeaderSummary>

          <PageHeaderAside>
            {config?.docsUrl && <DocsButton key="docs" href={config.docsUrl} />}
          </PageHeaderAside>
        </PageHeaderMeta>

        {navigationItems.length > 0 && (
          <PageHeaderNavigationTabs>
            <NavMenu>
              {navigationItems.map((item) => (
                <NavMenuItem key={item.label} active={pathname === item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </PageHeaderNavigationTabs>
        )}
      </PageHeader>
      {children}
    </>
  )
}
