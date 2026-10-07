import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PropsWithChildren,
} from 'react'
import { useDebouncedCallback } from 'use-debounce'

import type { StorageItem } from '../Storage.types'
import {
  clampIndex,
  getEntryItemIndex,
  isItemReady,
  isReadyFile,
  isReadyFolder,
  resolveCursor,
  type ExplorerCursor,
} from './FileExplorerKeyboardNavigation.utils'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { useLatest } from '@/hooks/misc/useLatest'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useStorageExplorerState, useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/**
 * How long the cursor has to settle before what it landed on is opened. Holding an arrow
 * key down then walks through a folder without a listing request or a signed URL per row.
 */
const ACTIVATION_DELAY_MS = 250

/**
 * Where an activation came from. A click or Enter is a deliberate choice; walking the
 * columns with the arrow keys is browsing, and is treated more gently — it replaces the
 * history entry rather than adding one, and it leaves a selection in progress alone.
 */
type ActivationSource = 'explicit' | 'browsing'

interface FileExplorerKeyboardNavigationContextValue {
  /** The row the keyboard is on, always pointing at a row that exists */
  cursor: ExplorerCursor
  /** True while a column has focus — the cursor is only drawn when it can be driven */
  isListFocused: boolean
  registerColumn: (columnIndex: number, element: HTMLElement | null) => void
  onColumnFocus: (columnIndex: number) => void
  onColumnBlur: (event: FocusEvent<HTMLElement>) => void
  onColumnKeyDown: (columnIndex: number, event: KeyboardEvent<HTMLElement>) => void
  /** Puts the cursor on a row that was clicked, and opens it */
  activateRow: (cursor: ExplorerCursor) => void
}

const FileExplorerKeyboardNavigationContext =
  createContext<FileExplorerKeyboardNavigationContextValue | null>(null)

export const useFileExplorerKeyboardNavigation = () => {
  const context = useContext(FileExplorerKeyboardNavigationContext)
  if (!context) {
    throw new Error(
      'useFileExplorerKeyboardNavigation must be used within a FileExplorerKeyboardNavigationProvider'
    )
  }
  return context
}

interface FileExplorerKeyboardNavigationProviderProps {
  isListView: boolean
}

/**
 * Drives the file explorer the way a column browser does: up and down move through a
 * folder, and whatever the cursor lands on opens — a folder shows its contents in the next
 * column, a file opens its preview. Right moves into the folder's first row, left (or
 * Shift+Tab) moves back out onto the folder itself, which stays open behind the cursor.
 *
 * Columns are virtualized, so the cursor is a piece of state rather than DOM focus — focus
 * stays on the column, which points `aria-activedescendant` at the active row. The arrow
 * keys are handled on the column rather than registered as shortcuts: they belong to the
 * focused list, and registering them would capture arrow keys across the whole page.
 * Getting *into* the list is the part that needs a shortcut, and that one is registered.
 */
export const FileExplorerKeyboardNavigationProvider = ({
  isListView,
  children,
}: PropsWithChildren<FileExplorerKeyboardNavigationProviderProps>) => {
  const snap = useStorageExplorerStateSnapshot()
  /** For reads that have to be current, i.e. after awaiting a folder listing */
  const explorerState = useStorageExplorerState()
  const { openFolderAtIndex, truncateToColumn, setPreviewedFile, clearPreviewedFile } =
    useStorageExplorerNavigation()

  const [requestedCursor, setRequestedCursor] = useState<ExplorerCursor>({
    columnIndex: 0,
    itemIndex: 0,
  })
  const [isListFocused, setIsListFocused] = useState(false)

  const columnElements = useRef(new Map<number, HTMLElement>())
  /** Set by the keys that move between columns, so only they pull focus along */
  const shouldFollowCursorRef = useRef(false)

  const columns = snap.columns
  const cursor = resolveCursor(requestedCursor, columns, { isListView })

  // Activation runs once the cursor settles, so it reads the store as it is then rather
  // than as it was when the keystroke was handled.
  const latestSnapshot = useLatest(snap)

  const activateItem = (target: ExplorerCursor, source: ActivationSource) => {
    const state = latestSnapshot.current
    const item = state.columns[target.columnIndex]?.items[target.itemIndex]
    if (!isItemReady(item)) return

    if (isReadyFolder(item)) {
      // List view shows one folder at a time, so opening whatever the cursor passes over
      // would march the view down the tree. There, a folder opens when it is chosen.
      if (source === 'browsing' && isListView) return

      const isAlreadyOpen = state.openedFolders[target.columnIndex]?.name === item.name
      if (isAlreadyOpen) return
      openFolderAtIndex(target.columnIndex, item, {
        history: source === 'explicit' ? 'push' : 'replace',
      })
      return
    }

    if (!isReadyFile(item)) return
    // Opening a preview clears the checkbox selection, so a selection being built up with
    // Space wins over the preview that browsing past a file would otherwise open.
    if (source === 'browsing' && state.selectedItems.length > 0) return
    if (state.selectedFilePreview?.id === item.id) return
    setPreviewedFile({ ...item, columnIndex: target.columnIndex })
  }

  const activateWhenCursorSettles = useDebouncedCallback(
    (target: ExplorerCursor) => activateItem(target, 'browsing'),
    ACTIVATION_DELAY_MS
  )

  useEffect(() => () => activateWhenCursorSettles.cancel(), [activateWhenCursorSettles])

  const registerColumn = (columnIndex: number, element: HTMLElement | null) => {
    if (element === null) columnElements.current.delete(columnIndex)
    else columnElements.current.set(columnIndex, element)
  }

  // Moving into a folder renders its column a commit later, so focus follows the cursor
  // from here rather than from the handler that moved it.
  useEffect(() => {
    if (!shouldFollowCursorRef.current) return
    const element = columnElements.current.get(cursor.columnIndex)
    if (!element) return
    shouldFollowCursorRef.current = false
    element.focus()
  }, [cursor.columnIndex, columns.length])

  const moveCursor = (
    next: ExplorerCursor,
    { followFocus = false, activate = false }: { followFocus?: boolean; activate?: boolean } = {}
  ) => {
    if (followFocus) shouldFollowCursorRef.current = true
    setRequestedCursor(next)

    activateWhenCursorSettles.cancel()
    if (activate) activateWhenCursorSettles(next)
  }

  /** Right: into the folder under the cursor, landing on its first row */
  const enterFolder = async (columnIndex: number, item: StorageItem | undefined) => {
    if (!isReadyFolder(item)) return

    const isAlreadyOpen =
      snap.openedFolders[columnIndex]?.name === item.name && columns.length > columnIndex + 1
    if (!isAlreadyOpen) {
      activateWhenCursorSettles.cancel()
      await openFolderAtIndex(columnIndex, item, { history: 'replace' })
    }

    // An empty folder has no row to move onto, so the cursor stays on the folder itself.
    // Read the store rather than the snapshot: the listing landed during the await, which
    // a render has not necessarily caught up with yet.
    const folderContents = explorerState.columns[columnIndex + 1]
    if (folderContents === undefined || folderContents.items.length === 0) return

    moveCursor(
      { columnIndex: columnIndex + 1, itemIndex: 0 },
      { followFocus: true, activate: true }
    )
  }

  /** Left: back out onto the folder itself, which stays open behind the cursor */
  const leaveFolder = (columnIndex: number) => {
    if (columnIndex === 0) return

    // Read the folder being left before list view collapses the record of it
    const itemIndex = getEntryItemIndex(
      columns[columnIndex - 1],
      snap.openedFolders[columnIndex - 1]?.name
    )

    // The cursor lands on a folder, so a file preview left over from the column being
    // left no longer belongs to anything on screen
    if (snap.selectedFilePreview !== undefined) clearPreviewedFile()

    // List view only renders the deepest column, so moving out has to close the folder.
    // In column view it stays open: that is what having it selected looks like.
    if (isListView) truncateToColumn(columnIndex - 1)

    // No activation: the row being landed on is the folder that is already open
    moveCursor({ columnIndex: columnIndex - 1, itemIndex }, { followFocus: true })
  }

  const toggleItemSelection = (
    columnIndex: number,
    itemIndex: number,
    item: StorageItem | undefined,
    { isRangeSelect }: { isRangeSelect: boolean }
  ) => {
    // Selection drives the bulk actions, which only ever apply to files
    if (!isReadyFile(item)) return
    // Space is a deliberate selection, so the preview browsing would open loses out
    activateWhenCursorSettles.cancel()

    if (isRangeSelect && snap.selectedItems.length > 0) {
      snap.selectRangeItems(columnIndex, itemIndex)
      return
    }

    const isSelected = snap.selectedItems.some((selected) => selected.id === item.id)
    snap.setSelectedItems(
      isSelected
        ? snap.selectedItems.filter((selected) => selected.id !== item.id)
        : [...snap.selectedItems, { ...item, columnIndex }]
    )
  }

  const activateRow = (target: ExplorerCursor) => {
    moveCursor(target)
    // The column is on screen already, so it can take focus right away and the arrow keys
    // carry on from the row that was clicked
    columnElements.current.get(target.columnIndex)?.focus()
    activateItem(target, 'explicit')
  }

  const onColumnFocus = (columnIndex: number) => {
    setIsListFocused(true)
    if (columnIndex === cursor.columnIndex) return
    // Tabbing into another column takes the cursor with it but opens nothing: arriving
    // somewhere is not the same as choosing a row
    moveCursor({
      columnIndex,
      itemIndex: getEntryItemIndex(columns[columnIndex], snap.openedFolders[columnIndex]?.name),
    })
  }

  const onColumnBlur = (event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget
    const isMovingToAnotherColumn =
      nextTarget instanceof HTMLElement &&
      Array.from(columnElements.current.values()).includes(nextTarget)
    if (!isMovingToAnotherColumn) setIsListFocused(false)
  }

  const onColumnKeyDown = (columnIndex: number, event: KeyboardEvent<HTMLElement>) => {
    // Keys typed in a row's checkbox, action menu or rename field belong to that control
    if (event.target !== event.currentTarget) return

    const column = columns[columnIndex]
    if (!column) return

    const itemCount = column.items.length
    const itemIndex =
      columnIndex === cursor.columnIndex
        ? cursor.itemIndex
        : getEntryItemIndex(column, snap.openedFolders[columnIndex]?.name)
    const item = column.items[itemIndex]

    const moveWithinColumn = (nextItemIndex: number) => {
      if (itemCount === 0) return
      event.preventDefault()
      moveCursor(
        { columnIndex, itemIndex: clampIndex(nextItemIndex, itemCount) },
        { activate: true }
      )
    }

    switch (event.key) {
      case 'ArrowDown':
        return moveWithinColumn(itemIndex + 1)
      case 'ArrowUp':
        return moveWithinColumn(itemIndex - 1)
      case 'Home':
        return moveWithinColumn(0)
      case 'End':
        return moveWithinColumn(itemCount - 1)
      case 'ArrowRight':
        event.preventDefault()
        enterFolder(columnIndex, item)
        return
      case 'ArrowLeft':
        event.preventDefault()
        leaveFolder(columnIndex)
        return
      case 'Tab':
        // Shift+Tab walks back out of a folder, the way Left does. Plain Tab, and
        // Shift+Tab at the bucket root, still move focus out of the explorer.
        if (!event.shiftKey || columnIndex === 0) return
        event.preventDefault()
        leaveFolder(columnIndex)
        return
      case 'Enter':
        event.preventDefault()
        if (isReadyFolder(item)) {
          enterFolder(columnIndex, item)
          return
        }
        // Choosing a file outright, so it does not wait out the debounce
        activateWhenCursorSettles.cancel()
        activateItem({ columnIndex, itemIndex }, 'explicit')
        return
      case ' ':
        event.preventDefault()
        toggleItemSelection(columnIndex, itemIndex, item, { isRangeSelect: event.shiftKey })
        return
      default:
        return
    }
  }

  /** Entry point from outside the list: park the cursor on an edge row and take focus */
  const startNavigation = (edge: 'first' | 'last') => {
    // A menu or dialog drives its own arrow keys, and pulling focus out of one would
    // close it. The shortcut is global on this page, so this is where that is ruled out.
    const activeElement = document.activeElement
    if (activeElement?.closest('[role="menu"],[role="dialog"],[role="menuitem"]')) return

    const { columnIndex } = cursor
    const itemCount = columns[columnIndex]?.items.length ?? 0
    moveCursor(
      { columnIndex, itemIndex: edge === 'first' ? 0 : clampIndex(itemCount - 1, itemCount) },
      { activate: true }
    )
    columnElements.current.get(columnIndex)?.focus()
  }

  const canStartNavigation = !isListFocused && columns.length > 0
  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_START_NAV_DOWN, () => startNavigation('first'), {
    enabled: canStartNavigation,
  })
  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_START_NAV_UP, () => startNavigation('last'), {
    enabled: canStartNavigation,
  })

  return (
    <FileExplorerKeyboardNavigationContext.Provider
      value={{
        cursor,
        isListFocused,
        registerColumn,
        onColumnFocus,
        onColumnBlur,
        onColumnKeyDown,
        activateRow,
      }}
    >
      {children}
    </FileExplorerKeyboardNavigationContext.Provider>
  )
}
