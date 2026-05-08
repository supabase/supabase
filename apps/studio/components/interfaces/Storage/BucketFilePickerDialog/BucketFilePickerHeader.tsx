import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Columns,
  List,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER, STORAGE_VIEWS } from '../Storage.constants'
import { useStoragePreference } from '../StorageExplorer/useStoragePreference'
import { uploadFilesToBucket } from './BucketFilePickerDialog.utils'
import { useBucketFilePickerStateSnapshot } from './BucketFilePickerState'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { storageKeys } from '@/data/storage/keys'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

const VIEW_OPTIONS = [
  { key: STORAGE_VIEWS.COLUMNS, name: 'As columns' },
  { key: STORAGE_VIEWS.LIST, name: 'As list' },
]

const SORT_BY_OPTIONS = [
  { key: STORAGE_SORT_BY.NAME, name: 'Name' },
  { key: STORAGE_SORT_BY.CREATED_AT, name: 'Time created' },
  { key: STORAGE_SORT_BY.UPDATED_AT, name: 'Time modified' },
  { key: STORAGE_SORT_BY.LAST_ACCESSED_AT, name: 'Time last accessed' },
]

const SORT_ORDER_OPTIONS = [
  { key: STORAGE_SORT_BY_ORDER.ASC, name: 'Ascending' },
  { key: STORAGE_SORT_BY_ORDER.DESC, name: 'Descending' },
]

const HeaderBreadcrumbs = ({
  breadcrumbs,
  selectBreadcrumb,
}: {
  breadcrumbs: string[]
  selectBreadcrumb: (i: number) => void
}) => {
  // Max 5 crumbs, otherwise replace middle segment with ellipsis and only
  // have the first 2 and last 2 crumbs visible
  const ellipsis = '...'
  const breadcrumbsWithIndexes = breadcrumbs.map((name: string, index: number) => {
    return { name, index }
  })

  const formattedBreadcrumbs =
    breadcrumbsWithIndexes.length <= 5
      ? breadcrumbsWithIndexes
      : breadcrumbsWithIndexes
          .slice(0, 2)
          .concat([{ name: ellipsis, index: -1 }])
          .concat(
            breadcrumbsWithIndexes.slice(
              breadcrumbsWithIndexes.length - 2,
              breadcrumbsWithIndexes.length
            )
          )

  return (
    <div className="ml-3 flex min-w-0 flex-1 items-center overflow-hidden">
      {formattedBreadcrumbs.map((crumb, idx: number) => {
        const isEllipsis = crumb.name === ellipsis
        const isActive = crumb.index === breadcrumbs.length - 1

        return (
          <div className="flex shrink-0 items-center" key={`${crumb.index}-${crumb.name}`}>
            {idx !== 0 && (
              <ChevronRight size={14} strokeWidth={2} className="text-foreground-muted mx-1" />
            )}
            {isEllipsis ? (
              <span className="max-w-24 truncate text-sm text-foreground-light">{crumb.name}</span>
            ) : isActive ? (
              <span className="max-w-24 truncate text-sm text-foreground">{crumb.name}</span>
            ) : (
              <button
                type="button"
                className="max-w-24 truncate border-0 bg-transparent p-0 text-left text-sm text-foreground-lighter transition-colors hover:text-foreground focus-visible:text-foreground"
                onClick={() => selectBreadcrumb(crumb.index)}
              >
                {crumb.name}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const BucketFilePickerHeader = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()

  const [isSearching, setIsSearching] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const uploadButtonRef = useRef<HTMLInputElement | null>(null)

  const { hostEndpoint } = useProjectApiUrl({ projectRef: projectRef! })

  const { view, sortBy, sortByOrder, setSortBy, setSortByOrder, setView } = useStoragePreference(
    projectRef!
  )

  const {
    bucket,
    columns,
    itemSearchString,
    setItemSearchString,
    popColumn,
    popColumnAtIndex,
    setSelectedFilePreview,
  } = useBucketFilePickerStateSnapshot()

  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const breadcrumbs = columns
  const backDisabled = columns.length < 1

  const onSelectBack = () => {
    popColumn()
    setSelectedFilePreview(undefined)
  }

  const onSelectUpload = () => {
    if (uploadButtonRef.current) {
      uploadButtonRef.current.click()
    }
  }

  const handleFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!hostEndpoint) {
      console.error('Host endpoint not available')
      return
    }
    const files = Array.from(event.target.files || [])
    try {
      setIsUploading(true)
      await uploadFilesToBucket({
        files,
        projectRef: projectRef!,
        hostEndpoint,
        bucketName: bucket.name,
        bucketId: bucket.id,
        currentPath: columns.join('/'),
        queryClient,
      })
      queryClient.invalidateQueries({
        queryKey: storageKeys.objects(projectRef!, bucket.id, columns.join('/')),
      })
    } catch (error) {
      console.error('Failed to upload files:', error)
      // Consider showing a toast notification to the user
    } finally {
      event.target.value = ''
      setIsUploading(false)
    }
  }

  /** Methods for searching */
  const toggleSearch = () => {
    setIsSearching(true)
  }

  const onCancelSearch = () => {
    setIsSearching(false)
    setItemSearchString('')
  }

  /** Methods for breadcrumbs */

  const selectBreadcrumb = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    const queryKey = storageKeys.objects(projectRef!, bucket.id, '').filter(Boolean)
    try {
      await queryClient.refetchQueries({ queryKey: queryKey, type: 'active' })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="rounded-t-md border-b border-overlay bg-surface-100">
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="flex min-h-[40px] w-max min-w-full items-center justify-between">
          {/* Navigation */}
          <div className="flex min-w-0 flex-1 items-center overflow-hidden pl-2 py-[7px]">
            {breadcrumbs.length > 0 && (
              <>
                <Button
                  icon={<ArrowLeft size={16} strokeWidth={2} />}
                  size="tiny"
                  type="text"
                  className="shrink-0 px-1"
                  disabled={backDisabled}
                  onClick={() => {
                    onSelectBack()
                  }}
                />
                <div className="mx-1 h-5 shrink-0 border-r border-strong" />
              </>
            )}
            {breadcrumbs.length > 0 ? (
              <HeaderBreadcrumbs breadcrumbs={breadcrumbs} selectBreadcrumb={selectBreadcrumb} />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center whitespace-nowrap py-[7px]">
            <div className="flex shrink-0 items-center space-x-1 px-2">
              <Button
                size="tiny"
                icon={<RefreshCw />}
                type="text"
                loading={isRefreshing}
                onClick={refreshData}
              >
                Reload
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="text"
                    icon={
                      view === 'LIST' ? (
                        <List size={16} strokeWidth={2} />
                      ) : (
                        <Columns size={16} strokeWidth={2} />
                      )
                    }
                  >
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 min-w-0">
                  {VIEW_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => setView(option.key)}>
                      <div className="flex items-center justify-between w-full">
                        <p>{option.name}</p>
                        {view === option.key && (
                          <Check size={16} className="text-brand" strokeWidth={2} />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Sort by</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44">
                      {SORT_BY_OPTIONS.map((option) => (
                        <DropdownMenuItem key={option.key} onClick={() => setSortBy(option.key)}>
                          <div className="flex items-center justify-between w-full">
                            <p>{option.name}</p>
                            {sortBy === option.key && (
                              <Check size={16} className="text-brand" strokeWidth={2} />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Sort order</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {SORT_ORDER_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.key}
                          onClick={() => setSortByOrder(option.key)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <p>{option.name}</p>
                            {sortByOrder === option.key && (
                              <Check size={16} className="text-brand" strokeWidth={2} />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="h-6 shrink-0 border-r border-control" />
            <div className="flex shrink-0 items-center space-x-1 px-2">
              <div className="hidden">
                <input ref={uploadButtonRef} type="file" multiple onChange={handleFilesUpload} />
              </div>
              <ButtonTooltip
                icon={<Upload size={16} strokeWidth={2} />}
                type="text"
                disabled={!canUpdateStorage}
                loading={isUploading}
                onClick={onSelectUpload}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canUpdateStorage
                      ? 'You need additional permissions to upload files'
                      : undefined,
                  },
                }}
              >
                Upload files
              </ButtonTooltip>
            </div>

            <div className="h-6 shrink-0 border-r border-control" />
            <div className="flex shrink-0 items-center px-2">
              {isSearching ? (
                <Input
                  size="tiny"
                  autoFocus
                  className="w-52"
                  icon={<Search />}
                  actions={[
                    <Button
                      key="cancel"
                      size="tiny"
                      type="text"
                      icon={<X />}
                      onClick={onCancelSearch}
                      className="p-0 h-5 w-5"
                    />,
                  ]}
                  placeholder="Search for a file or folder"
                  type="text"
                  value={itemSearchString}
                  onChange={(event) => setItemSearchString(event.target.value)}
                />
              ) : (
                <Button
                  icon={<Search />}
                  size="tiny"
                  type="text"
                  className="px-1"
                  onClick={toggleSearch}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
