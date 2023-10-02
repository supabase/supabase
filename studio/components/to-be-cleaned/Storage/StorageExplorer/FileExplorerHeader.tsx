import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { compact, debounce, isEqual, noop } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuRadioGroup_Shadcn_,
  DropdownMenuRadioItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconColumns,
  IconEdit2,
  IconFolderPlus,
  IconList,
  IconLoader,
  IconRefreshCw,
  IconSearch,
  IconUpload,
  IconX,
  Input,
} from 'ui'

import { useCheckPermissions } from 'hooks'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER, STORAGE_VIEWS } from '../Storage.constants'

const HeaderPathEdit = ({ loading, isSearching, breadcrumbs, togglePathEdit }: any) => {
  return (
    <div
      className={`group ${!loading ? 'cursor-pointer' : ''}`}
      onClick={() => (!loading.isLoading ? togglePathEdit() : {})}
    >
      {loading.isLoading ? (
        <div className="ml-2 flex items-center">
          <IconLoader size={16} strokeWidth={2} className="animate-spin" />
          <p className="ml-3 text-sm">{loading.message}</p>
        </div>
      ) : (
        <div className="flex cursor-pointer items-center">
          <p className="ml-3 text-sm truncate">{breadcrumbs[breadcrumbs.length - 1] || ''}</p>
          {!isSearching && (
            <div className="ml-3 flex items-center space-x-2 opacity-0 transition group-hover:opacity-100">
              <Button type="text" icon={<IconEdit2 />}>
                Navigate
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const HeaderBreadcrumbs = ({ loading, isSearching, breadcrumbs, selectBreadcrumb }: any) => {
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
      <IconLoader size={16} strokeWidth={2} className="animate-spin" />
      <p className="ml-3 text-sm">{loading.message}</p>
    </div>
  ) : (
    <div className={`ml-3 flex items-center ${isSearching && 'max-w-[140px] overflow-x-auto'}`}>
      {formattedBreadcrumbs.map((crumb: any, idx: number) => (
        <div className="flex items-center" key={crumb.name}>
          {idx !== 0 && <IconChevronRight size={10} strokeWidth={2} className="mx-3" />}
          <p
            key={crumb.name}
            className={`truncate text-sm ${crumb.name !== ellipsis ? 'cursor-pointer' : ''}`}
            style={{ maxWidth: '6rem' }}
            onClick={() => (crumb.name !== ellipsis ? selectBreadcrumb(crumb.index) : {})}
          >
            {crumb.name}
          </p>
        </div>
      ))}
    </div>
  )
}

interface FileExplorerHeader {
  itemSearchString: string
  setItemSearchString: (value: string) => void
  onFilesUpload: (event: any, columnIndex: number) => void
}

const FileExplorerHeader = ({
  itemSearchString = '',
  setItemSearchString = noop,
  onFilesUpload = noop,
}: FileExplorerHeader) => {
  const debounceDuration = 300
  const snap = useStorageExplorerStateSnapshot()

  const [pathString, setPathString] = useState('')
  const [searchString, setSearchString] = useState('')
  const [loading, setLoading] = useState({ isLoading: false, message: '' })

  const [isEditingPath, setIsEditingPath] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const uploadButtonRef: any = useRef(null)
  const previousBreadcrumbs: any = useRef(null)

  const storageExplorerStore = useStorageStore()
  const {
    view,
    setView,
    columns,
    sortBy,
    setSortBy,
    sortByOrder,
    setSortByOrder,
    popColumn,
    popColumnAtIndex,
    popOpenedFolders,
    popOpenedFoldersAtIndex,
    fetchFoldersByPath,
    refetchAllOpenedFolders,
    addNewFolderPlaceholder,
    clearOpenedFolders,
    closeFilePreview,
  } = storageExplorerStore

  const breadcrumbs = columns.map((column: any) => column.name)
  const backDisabled = columns.length <= 1
  const canUpdateStorage = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  useEffect(() => {
    if (itemSearchString) setSearchString(itemSearchString)
  }, [])

  useEffect(() => {
    // [Joshen] Somehow toggle search triggers this despite breadcrumbs
    // being unchanged. Manually doing a prop check to fix this
    if (!isEqual(previousBreadcrumbs.current, breadcrumbs)) {
      setIsEditingPath(false)
      previousBreadcrumbs.current = breadcrumbs
    }
  }, [breadcrumbs])

  const searchInputHandler = useCallback(debounce(setItemSearchString, debounceDuration), [])
  const onSearchInputUpdate = (event: any) => {
    setSearchString(event.target.value)
    // @ts-ignore
    searchInputHandler(event.target.value)
  }

  const onSelectBack = () => {
    popColumn()
    popOpenedFolders()
    closeFilePreview()
  }

  const onSelectUpload = () => {
    if (uploadButtonRef.current) {
      uploadButtonRef.current.click()
    }
  }

  /** Methods for path editings */
  const togglePathEdit = () => {
    setIsEditingPath(true)
    setPathString(breadcrumbs.slice(1).join('/'))
    if (snap.isSearching) onCancelSearch()
  }

  const onUpdatePathString = (event: any) => {
    setPathString(event.target.value)
  }

  const navigateByPathString = (event: any) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setIsEditingPath(false)
    onSetPathByString(compact(pathString.split('/')))
  }

  const onSetPathByString = async (paths: any[]) => {
    if (paths.length === 0) {
      popColumnAtIndex(0)
      clearOpenedFolders()
      closeFilePreview()
    } else {
      const pathString = paths.join('/')
      setLoading({ isLoading: true, message: `Navigating to ${pathString}...` })
      await fetchFoldersByPath(paths)
      setLoading({ isLoading: false, message: '' })
    }
  }

  const cancelSetPathString = () => {
    setIsEditingPath(false)
  }

  /** Methods for searching */
  // Search is currently within local scope when the view is set to list
  // Searching for column view requires much more thinking
  const toggleSearch = () => {
    setIsEditingPath(false)
    snap.setIsSearching(true)
  }

  const onCancelSearch = () => {
    setSearchString('')
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

  return (
    <div
      className="
    flex h-[40px]
    items-center justify-between
    rounded-t-md border-b border-panel-border-light bg-panel-header-light px-2 dark:border-panel-border-dark dark:bg-panel-header-dark"
    >
      {/* Navigation */}
      <div className={`flex items-center ${isEditingPath ? 'w-1/2' : ''}`}>
        {breadcrumbs.length > 0 && (
          <Button
            icon={<IconChevronLeft size={16} strokeWidth={2} />}
            size="tiny"
            type="text"
            className={breadcrumbs.length > 1 ? 'opacity-100' : 'opacity-25'}
            disabled={backDisabled}
            onClick={() => {
              setIsEditingPath(false)
              onSelectBack()
            }}
          />
        )}
        {!snap.isSearching && <></>}
        {isEditingPath ? (
          <form className="ml-2 flex-grow">
            <Input
              autoFocus
              key="pathSet"
              type="text"
              size="small"
              value={pathString}
              onChange={onUpdatePathString}
              placeholder="e.g Parent Folder/Child Folder"
              actions={[
                <Button
                  key="cancelPath"
                  type="default"
                  htmlType="button"
                  onClick={cancelSetPathString}
                >
                  Cancel
                </Button>,
                <Button
                  key="setPath"
                  type="primary"
                  htmlType="submit"
                  onClick={navigateByPathString}
                >
                  Go to folder
                </Button>,
              ]}
            />
          </form>
        ) : view === STORAGE_VIEWS.COLUMNS ? (
          <HeaderPathEdit
            loading={loading}
            isSearching={snap.isSearching}
            breadcrumbs={breadcrumbs}
            togglePathEdit={togglePathEdit}
          />
        ) : (
          <HeaderBreadcrumbs
            loading={loading}
            isSearching={snap.isSearching}
            breadcrumbs={breadcrumbs}
            selectBreadcrumb={selectBreadcrumb}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Button
            className="mr-2"
            size="tiny"
            icon={<IconRefreshCw />}
            type="text"
            loading={isRefreshing}
            onClick={refreshData}
          >
            Reload
          </Button>
          <DropdownMenu_Shadcn_>
            <DropdownMenuTrigger_Shadcn_>
              <Button
                asChild
                icon={
                  view === 'LIST' ? (
                    <IconList size={16} strokeWidth={2} />
                  ) : (
                    <IconColumns size={16} strokeWidth={2} />
                  )
                }
                type="text"
                disabled={breadcrumbs.length === 0}
                onChange={setView}
              >
                <span>View as</span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>

            <DropdownMenuContent_Shadcn_>
              <DropdownMenuRadioGroup_Shadcn_
                key="viewOptions"
                value={view}
                onValueChange={setView}
              >
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_VIEWS.COLUMNS}>
                  Columns
                </DropdownMenuRadioItem_Shadcn_>
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_VIEWS.LIST}>
                  List
                </DropdownMenuRadioItem_Shadcn_>
              </DropdownMenuRadioGroup_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
          <DropdownMenu_Shadcn_>
            <DropdownMenuTrigger_Shadcn_>
              <Button
                asChild
                icon={<IconChevronsDown size={16} strokeWidth={2} />}
                type="text"
                disabled={breadcrumbs.length === 0}
              >
                <span>Sort by</span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>
            <DropdownMenuContent_Shadcn_>
              <DropdownMenuRadioGroup_Shadcn_
                key="sortOptions"
                value={sortBy}
                onValueChange={setSortBy}
              >
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_SORT_BY.NAME}>
                  Name
                </DropdownMenuRadioItem_Shadcn_>
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_SORT_BY.CREATED_AT}>
                  Time created
                </DropdownMenuRadioItem_Shadcn_>
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_SORT_BY.UPDATED_AT}>
                  Time modified
                </DropdownMenuRadioItem_Shadcn_>
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_SORT_BY.LAST_ACCESSED_AT}>
                  Time last accessed
                </DropdownMenuRadioItem_Shadcn_>
              </DropdownMenuRadioGroup_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
          <DropdownMenu_Shadcn_>
            <DropdownMenuTrigger_Shadcn_>
              <Button
                asChild
                icon={
                  sortByOrder === STORAGE_SORT_BY_ORDER.DESC ? (
                    <IconChevronsDown size={16} strokeWidth={2} />
                  ) : (
                    <IconChevronsUp size={16} strokeWidth={2} />
                  )
                }
                type="text"
                disabled={breadcrumbs.length === 0}
              >
                <span>Sort Order</span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>
            <DropdownMenuContent_Shadcn_>
              <DropdownMenuRadioGroup_Shadcn_
                key="sortOrderOptions"
                value={sortByOrder}
                onValueChange={setSortByOrder}
              >
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_SORT_BY_ORDER.ASC}>
                  Ascending
                </DropdownMenuRadioItem_Shadcn_>
                <DropdownMenuRadioItem_Shadcn_ value={STORAGE_SORT_BY_ORDER.DESC}>
                  Descending
                </DropdownMenuRadioItem_Shadcn_>
              </DropdownMenuRadioGroup_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
        </div>
        <div className="h-6 border-r border-panel-border-light dark:border-panel-border-dark" />
        <div className="flex items-center space-x-1">
          <div className="hidden">
            {/* @ts-ignore */}
            <input ref={uploadButtonRef} type="file" multiple onChange={onFilesUpload} />
          </div>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full">
              <Button
                icon={<IconUpload size={16} strokeWidth={2} />}
                type="text"
                disabled={!canUpdateStorage || breadcrumbs.length === 0}
                onClick={onSelectUpload}
              >
                Upload files
              </Button>
            </Tooltip.Trigger>
            {!canUpdateStorage && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to upload files
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full">
              <Button
                icon={<IconFolderPlus size={16} strokeWidth={2} />}
                type="text"
                disabled={!canUpdateStorage || breadcrumbs.length === 0}
                onClick={() => addNewFolderPlaceholder(-1)}
              >
                Create folder
              </Button>
            </Tooltip.Trigger>
            {!canUpdateStorage && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to create folders
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>

        <div className="h-6 border-r border-scale-600" />
        <div className="flex items-center pr-1.5">
          {snap.isSearching ? (
            <Input
              size="tiny"
              autoFocus
              className="w-52"
              icon={<IconSearch size={'tiny'} strokeWidth={2} />}
              actions={[
                <IconX
                  key="close"
                  className="mx-2 cursor-pointer text-foreground"
                  size="tiny"
                  strokeWidth={2}
                  onClick={onCancelSearch}
                />,
              ]}
              placeholder="Search for a file or folder"
              type="text"
              value={searchString}
              onChange={onSearchInputUpdate}
            />
          ) : (
            <Button
              icon={<IconSearch size={16} strokeWidth={2} />}
              size="tiny"
              type="text"
              className="px-1"
              onClick={toggleSearch}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default FileExplorerHeader
