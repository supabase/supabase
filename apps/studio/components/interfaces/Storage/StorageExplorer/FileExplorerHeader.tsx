import { PermissionAction } from '@supabase/shared-types/out/constants'
import { compact, isEqual, noop } from 'lodash'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Columns,
  Edit2,
  FolderPlus,
  List,
  LoaderCircle,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type SyntheticEvent,
} from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FieldDescription_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER, STORAGE_VIEWS } from '../Storage.constants'
import { useStoragePreference } from './useStoragePreference'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

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

interface NavigateDialogProps {
  open: boolean
  pathString: string
  onOpenChange: (open: boolean) => void
  onPathStringChange: ChangeEventHandler<HTMLInputElement>
  onCancel: () => void
  onSubmit: (event?: SyntheticEvent) => void
}

const NavigateDialog = ({
  open,
  pathString,
  onOpenChange,
  onPathStringChange,
  onCancel,
  onSubmit,
}: NavigateDialogProps) => {
  const inputId = 'storage-explorer-navigate-path'
  const descriptionId = 'storage-explorer-navigate-path-description'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Navigate to folder</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a folder path within this bucket.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="flex flex-col gap-y-2">
          <Label_Shadcn_ htmlFor={inputId}>Path</Label_Shadcn_>
          <Input
            id={inputId}
            autoFocus
            size="small"
            value={pathString}
            onChange={onPathStringChange}
            placeholder="parent/child/grandchild"
            aria-describedby={descriptionId}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSubmit(event)
            }}
          />
          <FieldDescription_Shadcn_ id={descriptionId} className="text-foreground-lighter">
            Enter a folder path within this bucket.
          </FieldDescription_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" onClick={onSubmit}>
            Navigate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const HeaderBreadcrumbs = ({
  loading,
  breadcrumbs,
  selectBreadcrumb,
}: {
  loading: { isLoading: boolean; message: string }
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

  return loading.isLoading ? (
    <div className="ml-2 flex items-center">
      <LoaderCircle size={14} strokeWidth={2} className="animate-spin text-foreground-lighter" />
      <p className="ml-3 text-sm">{loading.message}</p>
    </div>
  ) : (
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

interface FileExplorerHeader {
  itemSearchString: string
  setItemSearchString: (value: string) => void
  onFilesUpload: (event: ChangeEvent<HTMLInputElement>, columnIndex?: number) => void
}

export const FileExplorerHeader = ({
  itemSearchString = '',
  setItemSearchString = noop,
  onFilesUpload = noop,
}: FileExplorerHeader) => {
  const snap = useStorageExplorerStateSnapshot()
  const track = useTrack()

  const [pathString, setPathString] = useState('')
  const [loading, setLoading] = useState({ isLoading: false, message: '' })

  const [isPathDialogOpen, setIsPathDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const uploadButtonRef = useRef<HTMLInputElement | null>(null)
  const previousBreadcrumbs = useRef<string[] | null>(null)

  const {
    projectRef,
    columns,
    popColumn,
    popColumnAtIndex,
    popOpenedFolders,
    popOpenedFoldersAtIndex,
    fetchFoldersByPath,
    refetchAllOpenedFolders,
    addNewFolderPlaceholder,
    clearOpenedFolders,
    setSelectedFilePreview,
    selectedBucket,
  } = useStorageExplorerStateSnapshot()
  const {
    view,
    setView,
    sortBy,
    setSortBy: setPreferenceSortBy,
    sortByOrder,
    setSortByOrder: setPreferenceSortByOrder,
  } = useStoragePreference(projectRef)

  const breadcrumbs = columns.map((column) => column.name)
  const backDisabled = columns.length <= 1
  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const setSortBy = async (value: STORAGE_SORT_BY) => {
    setPreferenceSortBy(value)
    setSelectedFilePreview(undefined)
    await refetchAllOpenedFolders()
  }

  const setSortByOrder = async (value: STORAGE_SORT_BY_ORDER) => {
    setPreferenceSortByOrder(value)
    setSelectedFilePreview(undefined)
    await refetchAllOpenedFolders()
  }

  useEffect(() => {
    // [Joshen] Somehow toggle search triggers this despite breadcrumbs
    // being unchanged. Manually doing a prop check to fix this
    if (!isEqual(previousBreadcrumbs.current, breadcrumbs)) {
      setIsPathDialogOpen(false)
      previousBreadcrumbs.current = breadcrumbs
    }
  }, [breadcrumbs])

  const onSelectBack = () => {
    popColumn()
    popOpenedFolders()
    setSelectedFilePreview(undefined)
  }

  const onSelectUpload = () => {
    if (uploadButtonRef.current) {
      uploadButtonRef.current.click()
    }
  }

  /** Methods for path editings */
  const togglePathEdit = () => {
    setIsPathDialogOpen(true)
    setPathString(breadcrumbs.slice(1).join('/'))
    if (snap.isSearching) onCancelSearch()
  }

  const onUpdatePathString = (event: ChangeEvent<HTMLInputElement>) => {
    setPathString(event.target.value)
  }

  const navigateByPathString = async (event?: SyntheticEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const paths = compact(pathString.split('/'))
    setIsPathDialogOpen(false)
    await onSetPathByString(paths)

    if (paths.length > 0) {
      track('storage_explorer_navigate_submitted')
    }
  }

  const onSetPathByString = async (paths: string[]) => {
    if (paths.length === 0) {
      popColumnAtIndex(0)
      clearOpenedFolders()
      setSelectedFilePreview(undefined)
    } else {
      const pathString = paths.join('/')
      setLoading({ isLoading: true, message: `Navigating to ${pathString}...` })
      await fetchFoldersByPath({ paths })
      setLoading({ isLoading: false, message: '' })
    }
  }

  const cancelSetPathString = () => {
    setIsPathDialogOpen(false)
  }

  /** Methods for searching */
  // Search is currently within local scope when the view is set to list
  // Searching for column view requires much more thinking
  const toggleSearch = () => {
    setIsPathDialogOpen(false)
    snap.setIsSearching(true)
  }

  const onCancelSearch = () => {
    snap.setIsSearching(false)
    setItemSearchString('')
  }

  /** Methods for breadcrumbs */

  const selectBreadcrumb = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await refetchAllOpenedFolders()
    setIsRefreshing(false)
  }

  const onOpenNavigate = () => {
    track('storage_explorer_navigate_clicked')
    togglePathEdit()
  }

  return (
    <div className="rounded-t-md border-b border-overlay bg-surface-100">
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="flex min-h-[40px] w-max min-w-full items-center justify-between">
          {/* Navigation */}
          <div className="flex min-w-0 flex-1 items-center overflow-hidden pl-2 py-[7px]">
            {breadcrumbs.length > 1 && (
              <>
                <Button
                  icon={<ArrowLeft size={16} strokeWidth={2} />}
                  size="tiny"
                  type="text"
                  className="shrink-0 px-1"
                  disabled={backDisabled}
                  onClick={() => {
                    setIsPathDialogOpen(false)
                    onSelectBack()
                  }}
                />
                <div className="mx-1 h-5 shrink-0 border-r border-strong" />
              </>
            )}
            {breadcrumbs.length > 1 ? (
              <HeaderBreadcrumbs
                loading={loading}
                breadcrumbs={breadcrumbs}
                selectBreadcrumb={selectBreadcrumb}
              />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center whitespace-nowrap py-[7px]">
            <div className="flex shrink-0 items-center space-x-1 px-2">
              {view === STORAGE_VIEWS.COLUMNS && (
                <Button
                  size="tiny"
                  icon={<Edit2 />}
                  type="text"
                  disabled={isPathDialogOpen || loading.isLoading}
                  onClick={onOpenNavigate}
                >
                  Navigate
                </Button>
              )}
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
                <input ref={uploadButtonRef} type="file" multiple onChange={onFilesUpload} />
              </div>
              <ButtonTooltip
                icon={<Upload size={16} strokeWidth={2} />}
                type="text"
                disabled={!canUpdateStorage || breadcrumbs.length === 0}
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
              <ButtonTooltip
                icon={<FolderPlus size={16} strokeWidth={2} />}
                type="text"
                disabled={!canUpdateStorage || breadcrumbs.length === 0}
                onClick={() => addNewFolderPlaceholder(-1)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canUpdateStorage
                      ? 'You need additional permissions to create folders'
                      : undefined,
                  },
                }}
              >
                Create folder
              </ButtonTooltip>
            </div>

            <div className="h-6 shrink-0 border-r border-control" />
            <div className="flex shrink-0 items-center px-2">
              {snap.isSearching ? (
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

      <NavigateDialog
        open={isPathDialogOpen}
        pathString={pathString}
        onOpenChange={setIsPathDialogOpen}
        onPathStringChange={onUpdatePathString}
        onCancel={cancelSetPathString}
        onSubmit={navigateByPathString}
      />
    </div>
  )
}
