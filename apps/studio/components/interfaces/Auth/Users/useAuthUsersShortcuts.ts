import { Dispatch, RefObject, SetStateAction, useEffect, useState } from 'react'
import type { CellKeyboardEvent, DataGridHandle } from 'react-data-grid'

import { MAX_BULK_DELETE } from './Users.constants'
import type { User } from '@/data/auth/users-infinite-query'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseAuthUsersShortcutsParams {
  gridRef: RefObject<DataGridHandle>
  searchInputRef: RefObject<HTMLInputElement>
  users: User[]
  selectedId: string | null
  selectedUsers: Set<unknown>
  sortByValue: string
  canCreateUsers: boolean
  canInviteUsers: boolean
  showSendInvitation: boolean
  onRefresh: () => void
  setSelectedId: (value: string | null) => void
  setSelectedUsers: Dispatch<SetStateAction<Set<unknown>>>
  setFilterKeywords: (value: string) => void
  setFilterUserType: (value: 'all') => void
  setSelectedProviders: (value: string[]) => void
  setSortByValue: (value: string) => void
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>
  setCreateVisible: (value: boolean) => void
  setInviteVisible: (value: boolean) => void
}

interface GridCellKeyDownArgs {
  mode: 'SELECT' | 'EDIT'
  row: unknown
  rowIdx: number
}

interface UseAuthUsersShortcutsResult {
  onCellKeyDown: (args: GridCellKeyDownArgs, event: CellKeyboardEvent) => void
}

export function useAuthUsersShortcuts({
  gridRef,
  searchInputRef,
  users,
  selectedId,
  selectedUsers,
  sortByValue,
  canCreateUsers,
  canInviteUsers,
  showSendInvitation,
  onRefresh,
  setSelectedId,
  setSelectedUsers,
  setFilterKeywords,
  setFilterUserType,
  setSelectedProviders,
  setSortByValue,
  setShowDeleteModal,
  setCreateVisible,
  setInviteVisible,
}: UseAuthUsersShortcutsParams): UseAuthUsersShortcutsResult {
  const [hasCellSelected, setHasCellSelected] = useState(false)

  useEffect(() => {
    const el = gridRef.current?.element
    if (!el) return
    const onFocusIn = () => setHasCellSelected(true)
    const onFocusOut = (event: FocusEvent) => {
      if (!el.contains(event.relatedTarget as Node | null)) {
        setHasCellSelected(false)
      }
    }
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    return () => {
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
    }
  }, [gridRef])

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search users' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => {
    setFilterKeywords('')
    setFilterUserType('all')
    setSelectedProviders([])
  })

  useShortcut(SHORTCUT_IDS.AUTH_USERS_REFRESH, onRefresh)

  useShortcut(SHORTCUT_IDS.AUTH_USERS_CLEAR_SORT, () => setSortByValue('created_at:desc'), {
    enabled: sortByValue !== 'created_at:desc',
  })

  useShortcut(
    SHORTCUT_IDS.AUTH_USERS_TOGGLE_ALL_SELECTION,
    () => {
      if (selectedUsers.size === users.length) {
        setSelectedUsers(new Set([]))
      } else {
        setSelectedUsers(new Set(users.map((u) => u.id)))
      }
    },
    { enabled: users.length > 0 && users.length <= MAX_BULK_DELETE }
  )

  useShortcut(SHORTCUT_IDS.AUTH_USERS_DELETE_SELECTED, () => setShowDeleteModal(true), {
    enabled: selectedUsers.size > 0,
  })

  useShortcut(
    SHORTCUT_IDS.AUTH_USERS_EXIT_SELECTION,
    () => {
      setSelectedUsers(new Set([]))
      setHasCellSelected(false)
      ;(document.activeElement as HTMLElement | null)?.blur()
    },
    { enabled: !selectedId && (selectedUsers.size > 0 || hasCellSelected) }
  )

  useShortcut(SHORTCUT_IDS.AUTH_USERS_CLOSE_PANEL, () => setSelectedId(null), {
    enabled: !!selectedId,
  })

  const startGridNavigation = () => {
    if (users.length === 0) return
    gridRef.current?.selectCell({ idx: 1, rowIdx: 0 })
  }

  useShortcut(SHORTCUT_IDS.AUTH_USERS_START_NAV_DOWN, startGridNavigation, {
    enabled: !hasCellSelected && users.length > 0,
  })

  useShortcut(SHORTCUT_IDS.AUTH_USERS_START_NAV_UP, startGridNavigation, {
    enabled: !hasCellSelected && users.length > 0,
  })

  useShortcut(SHORTCUT_IDS.AUTH_USERS_CREATE_USER, () => setCreateVisible(true), {
    enabled: canCreateUsers,
  })

  useShortcut(SHORTCUT_IDS.AUTH_USERS_INVITE_USER, () => setInviteVisible(true), {
    enabled: canInviteUsers && showSendInvitation,
  })

  const onCellKeyDown = (args: GridCellKeyDownArgs, event: CellKeyboardEvent) => {
    if (args.mode !== 'SELECT' || event.key !== 'Enter') return
    const id = (args.row as { id?: unknown } | null | undefined)?.id
    if (typeof id !== 'string') return
    setSelectedId(id)
    gridRef.current?.scrollToCell({ idx: 0, rowIdx: args.rowIdx })
  }

  return { onCellKeyDown }
}
