import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs'
import { Dispatch, RefObject, SetStateAction, useEffect, useState } from 'react'
import type { CellKeyboardEvent, DataGridHandle } from 'react-data-grid'

import { MAX_BULK_DELETE } from './Users.constants'
import type { User } from '@/data/auth/users-infinite-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseAuthUsersShortcutsParams {
  gridRef: RefObject<DataGridHandle>
  searchInputRef: RefObject<HTMLInputElement>
  users: User[]
  selectedUsers: Set<unknown>
  setSelectedUsers: Dispatch<SetStateAction<Set<unknown>>>
  setSearch: Dispatch<SetStateAction<string>>
  onRefresh: () => void
}

interface GridCellKeyDownArgs {
  mode: 'SELECT' | 'EDIT'
  row: unknown
  rowIdx: number
}

interface UseAuthUsersShortcutsResult {
  onCellKeyDown: (args: GridCellKeyDownArgs, event: CellKeyboardEvent) => void
  showDeleteModal: boolean
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>
}

export function useAuthUsersShortcuts({
  gridRef,
  searchInputRef,
  users,
  selectedUsers,
  setSelectedUsers,
  setSearch,
  onRefresh,
}: UseAuthUsersShortcutsParams): UseAuthUsersShortcutsResult {
  const [hasCellSelected, setHasCellSelected] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedId, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const [, setFilterKeywords] = useQueryState('keywords', { defaultValue: '' })
  const [, setFilterUserType] = useQueryState(
    'userType',
    parseAsStringEnum(['all', 'verified', 'unverified', 'anonymous']).withDefault('all')
  )
  const [, setSelectedProviders] = useQueryState(
    'providers',
    parseAsArrayOf(parseAsString, ',').withDefault([])
  )
  const [sortByValue, setSortByValue] = useQueryState('sortBy', {
    defaultValue: 'created_at:desc',
  })
  const [, setInviteVisible] = useQueryState(
    'invite',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [, setCreateVisible] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { can: canCreateUsers } = useAsyncCheckPermissions(
    PermissionAction.AUTH_EXECUTE,
    'create_user'
  )
  const { can: canInviteUsers } = useAsyncCheckPermissions(
    PermissionAction.AUTH_EXECUTE,
    'invite_user'
  )
  const showSendInvitation = useIsFeatureEnabled('authentication:show_send_invitation')

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
    setSearch('')
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

  return { onCellKeyDown, showDeleteModal, setShowDeleteModal }
}
