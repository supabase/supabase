import { Link, useMatchRoute } from '@tanstack/react-router'
import { IS_PLATFORM, useParams } from 'common'
import { PropsWithChildren } from 'react'
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

import { BUCKET_TYPES } from '@/components/interfaces/Storage/Storage.constants'
import { useStorageV2Page } from '@/components/interfaces/Storage/Storage.utils'
import { URL_SIGNING_KEYS_PAGE } from '@/components/interfaces/Storage/UrlSigningKeys/UrlSigningKeys.constants'
import { DocsButton } from '@/components/ui/DocsButton'

const getPageHeaderConfig = (page: ReturnType<typeof useStorageV2Page>) => {
  if (page === 'signing-keys') return URL_SIGNING_KEYS_PAGE
  if (page === undefined || page === 's3') return undefined
  return BUCKET_TYPES[page]
}

export const StorageBucketsLayout = ({
  title,
  hideSubtitle = false,
  children,
}: PropsWithChildren<{ title?: string; hideSubtitle?: boolean }>) => {
  const { ref } = useParams()
  const matchRoute = useMatchRoute()
  const page = useStorageV2Page()
  const config = getPageHeaderConfig(page)

  const navigationItems =
    page === 'files'
      ? [
          {
            label: 'Buckets',
            to: '/project/$ref/storage/files' as const,
          },
          ...(IS_PLATFORM
            ? [
                {
                  label: 'Settings',
                  to: '/project/$ref/storage/files/settings' as const,
                },
              ]
            : []),
          {
            label: 'Policies',
            to: '/project/$ref/storage/files/policies' as const,
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
                <NavMenuItem
                  key={item.label}
                  active={!!matchRoute({ to: item.to, params: { ref: ref ?? '_' }, fuzzy: false })}
                >
                  <Link
                    to={item.to}
                    params={{ ref: ref ?? '_' }}
                    activeOptions={{ exact: true, includeSearch: false }}
                  >
                    {item.label}
                  </Link>
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
