import { PermissionAction } from '@supabase/shared-types/out/constants'
import { compact, isEqual, noop } from 'lodash'
import {
  ArrowLeft,
  Check,
  Columns,
  Edit2,
  FolderPlus,
  List,
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
  FieldDescription,
  Label,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER, STORAGE_VIEWS } from '../Storage.constants'
import { pageChromeRowClassName } from './storageExplorerChrome'
import { useFileExplorerHeaderShortcuts } from './useFileExplorerHeaderShortcuts'
import { useStoragePreference } from './useStoragePreference'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
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
          <Label htmlFor={inputId}>Path</Label>
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
          <FieldDescription id={descriptionId} className="text-foreground-lighter">
            Enter a folder path within this bucket.
          </FieldDescription>
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

  const uploadButtonRef = useRef<HTMLInputElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const previousBreadcrumbs = useRef<string[] | null>(null)

  const {
    projectRef,
    columns,
    popColumn,
    popColumnAtIndex,
    popOpenedFolders,
    fetchFoldersByPath,
    refetchAllOpenedFolders,
    refreshAll,
    isRefreshing,
    addNewFolderPlaceholder,
    clearOpenedFolders,
    setSelectedFilePreview,
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
  const isListView = view === STORAGE_VIEWS.LIST
  const isBucketRoot = breadcrumbs.length <= 1
  const currentFolderName = breadcrumbs[breadcrumbs.length - 1]
  const searchPlaceholder = isBucketRoot
    ? 'Search in root directory...'
    : `Search in ${currentFolderName}...`
  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  useFileExplorerHeaderShortcuts({
    uploadButtonRef,
    searchInputRef,
    canUpdateStorage,
    hasBreadcrumbs: breadcrumbs.length > 0,
    isSearching: snap.isSearching,
    setIsSearching: snap.setIsSearching,
    addNewFolderPlaceholder,
    setView,
  })

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
  const onCancelSearch = () => {
    snap.setIsSearching(false)
    setItemSearchString('')
  }

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setItemSearchString(value)
    snap.setIsSearching(value.length > 0)
  }

  const refreshData = async () => {
    await refreshAll()
  }

  const onOpenNavigate = () => {
    track('storage_explorer_navigate_clicked')
    togglePathEdit()
  }

  return (
    <div className="border-b border-overlay bg-surface-100">
      <div className="overflow-x-auto">
        <div className={pageChromeRowClassName}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isListView && !isBucketRoot && (
              <Button
                size="tiny"
                type="outline"
                aria-label="Go up one level"
                className="w-7 shrink-0 px-1"
                icon={<ArrowLeft size={14} />}
                onClick={() => {
                  setIsPathDialogOpen(false)
                  onSelectBack()
                }}
              />
            )}
            <Input
              ref={searchInputRef}
              size="tiny"
              className="w-52"
              icon={<Search />}
              actions={
                itemSearchString.length > 0
                  ? [
                      <Button
                        key="cancel"
                        size="tiny"
                        type="text"
                        icon={<X />}
                        onClick={onCancelSearch}
                        className="p-0 h-5 w-5"
                      />,
                    ]
                  : undefined
              }
              placeholder={searchPlaceholder}
              type="text"
              value={itemSearchString}
              onChange={onSearchChange}
              onFocus={() => setIsPathDialogOpen(false)}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <div className="flex shrink-0 items-center gap-1">
              {view === STORAGE_VIEWS.COLUMNS && (
                <Button
                  size="tiny"
                  icon={<Edit2 />}
                  type="outline"
                  aria-label="Navigate"
                  className="w-7 px-1"
                  disabled={isPathDialogOpen || loading.isLoading}
                  onClick={onOpenNavigate}
                />
              )}
              <ShortcutTooltip shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_REFRESH} side="bottom">
                <Button
                  size="tiny"
                  icon={<RefreshCw />}
                  type="outline"
                  aria-label="Reload"
                  className="w-7 px-1"
                  loading={isRefreshing}
                  onClick={refreshData}
                />
              </ShortcutTooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="outline"
                    size="tiny"
                    aria-label="View options"
                    className="w-7 px-1"
                    icon={view === 'LIST' ? <List size={16} /> : <Columns size={16} />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 min-w-0">
                  {VIEW_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => setView(option.key)}>
                      <div className="flex items-center justify-between w-full">
                        <p>{option.name}</p>
                        {view === option.key && <Check size={16} className="text-brand" />}
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
                            {sortBy === option.key && <Check size={16} className="text-brand" />}
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
                              <Check size={16} className="text-brand" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <div className="hidden">
                <input ref={uploadButtonRef} type="file" multiple onChange={onFilesUpload} />
              </div>
              <ShortcutTooltip
                shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_NEW_FOLDER}
                side="bottom"
                open={!canUpdateStorage ? false : undefined}
              >
                <ButtonTooltip
                  icon={<FolderPlus size={16} />}
                  type="outline"
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
              </ShortcutTooltip>
              <ShortcutTooltip
                shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_UPLOAD}
                side="bottom"
                open={!canUpdateStorage ? false : undefined}
              >
                <ButtonTooltip
                  icon={<Upload size={16} />}
                  type="primary"
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
              </ShortcutTooltip>
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
