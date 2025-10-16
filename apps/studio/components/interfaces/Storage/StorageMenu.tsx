import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useFlag, useParams } from 'common'
import { CreateBucketModal } from 'components/interfaces/Storage/CreateBucketModal'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Menu } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
} from 'ui-patterns/InnerSideMenu'
import { BucketRow } from './BucketRow'

export const StorageMenu = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const { data: projectDetails } = useSelectedProjectQuery()
  const snap = useStorageExplorerStateSnapshot()

  const showMigrationCallout = useFlag('storageMigrationCallout')
  const { data: config } = useProjectStorageConfigQuery(
    { projectRef: ref },
    { enabled: showMigrationCallout }
  )
  const isListV2UpgradeAvailable =
    !!config && !config.capabilities.list_v2 && config.external.upstreamTarget === 'main'

  const isBranch = projectDetails?.parent_project_ref !== undefined

  const [searchText, setSearchText] = useState<string>('')

  const page = router.pathname.split('/')[4] as
    | undefined
    | 'policies'
    | 'settings'
    | 'usage'
    | 'logs'

  const {
    data: buckets = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useBucketsQuery({ projectRef: ref })
  const sortedBuckets =
    snap.sortBucket === 'alphabetical'
      ? buckets.sort((a, b) =>
          a.name.toLowerCase().trim().localeCompare(b.name.toLowerCase().trim())
        )
      : buckets.sort((a, b) => (new Date(b.created_at) > new Date(a.created_at) ? -1 : 1))
  const filteredBuckets =
    searchText.length > 1
      ? sortedBuckets.filter((bucket) => bucket.name.includes(searchText.trim()))
      : sortedBuckets
  const tempNotSupported = error?.message.includes('Tenant config') && isBranch

  return (
    <>
      <Menu type="pills" className="mt-6 flex flex-grow flex-col">
        <div className="mb-6 mx-5 flex flex-col gap-y-1.5">
          <CreateBucketModal />

          <InnerSideBarFilters className="px-0">
            <InnerSideBarFilterSearchInput
              name="search-buckets"
              aria-labelledby="Search buckets"
              placeholder="Search buckets..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
              }}
            >
              <InnerSideBarFilterSortDropdown
                value={snap.sortBucket}
                onValueChange={(value: any) => snap.setSortBucket(value)}
              >
                <InnerSideBarFilterSortDropdownItem
                  key="alphabetical"
                  value="alphabetical"
                  className="flex gap-2"
                >
                  Alphabetical
                </InnerSideBarFilterSortDropdownItem>
                <InnerSideBarFilterSortDropdownItem key="created-at" value="created-at">
                  Created at
                </InnerSideBarFilterSortDropdownItem>
              </InnerSideBarFilterSortDropdown>
            </InnerSideBarFilterSearchInput>
          </InnerSideBarFilters>
        </div>

        <div className="space-y-6">
          <div className="mx-3">
            <Menu.Group title={<span className="uppercase font-mono">All buckets</span>} />

            {isLoading && (
              <div className="space-y-2 mx-2">
                <ShimmeringLoader className="!py-2.5" />
                <ShimmeringLoader className="!py-2.5" />
                <ShimmeringLoader className="!py-2.5" />
              </div>
            )}

            {isError && (
              <div className="px-2">
                <Alert_Shadcn_ variant={tempNotSupported ? 'default' : 'warning'}>
                  <AlertTitle_Shadcn_ className="text-xs tracking-normal">
                    {tempNotSupported
                      ? 'Storage is not available on preview branches for now'
                      : 'Failed to fetch buckets'}
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="text-xs">
                    {tempNotSupported
                      ? "We're actively looking into making this available on preview branches"
                      : 'Please refresh to try again'}
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              </div>
            )}

            {isSuccess && (
              <>
                {buckets.length === 0 && (
                  <InnerSideBarEmptyPanel
                    className="mx-2"
                    title="No buckets available"
                    description="Buckets that you create will appear here"
                  />
                )}
                {searchText.length > 0 && filteredBuckets.length === 0 && (
                  <InnerSideBarEmptyPanel
                    className="mx-2"
                    title="No results found"
                    description={`Your search for "${searchText}" did not return any results`}
                  />
                )}
                {filteredBuckets.map((bucket, idx: number) => {
                  const isSelected = bucketId === bucket.id
                  return (
                    <BucketRow
                      key={`${idx}_${bucket.id}`}
                      bucket={bucket}
                      projectRef={ref}
                      isSelected={isSelected}
                    />
                  )
                })}
              </>
            )}
          </div>

          <div className="w-full bg-dash-sidebar px-3 py-6 sticky bottom-0 border-t border-border">
            <Menu.Group title={<span className="uppercase font-mono">Configuration</span>} />
            <Link href={`/project/${ref}/storage/policies`}>
              <Menu.Item rounded active={page === 'policies'}>
                <p className="truncate">Policies</p>
              </Menu.Item>
            </Link>
            {IS_PLATFORM && (
              <Link href={`/project/${ref}/storage/settings`}>
                <Menu.Item rounded active={page === 'settings'}>
                  <div className="flex items-center gap-x-2">
                    <p className="truncate">Settings</p>
                    {isListV2UpgradeAvailable && (
                      <InfoTooltip side="right">Upgrade available</InfoTooltip>
                    )}
                  </div>
                </Menu.Item>
              </Link>
            )}
          </div>
        </div>
      </Menu>
    </>
  )
}
