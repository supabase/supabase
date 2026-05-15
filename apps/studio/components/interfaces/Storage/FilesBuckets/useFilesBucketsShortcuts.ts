import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Dispatch, RefObject, SetStateAction } from 'react'

import { STORAGE_BUCKET_SORT } from '../Storage.constants'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseFilesBucketsShortcutsParams {
  searchInputRef: RefObject<HTMLInputElement | null>
  setFilterString: Dispatch<SetStateAction<string>>
  sortBucket: STORAGE_BUCKET_SORT
  setSortBucket: (value: STORAGE_BUCKET_SORT) => void
  setCreateVisible: (value: boolean) => void
  onRefresh: () => void
}

export function useFilesBucketsShortcuts({
  searchInputRef,
  setFilterString,
  sortBucket,
  setSortBucket,
  setCreateVisible,
  onRefresh,
}: UseFilesBucketsShortcutsParams) {
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search buckets' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_NEW_ITEM, () => setCreateVisible(true), {
    label: 'Create new bucket',
    enabled: canCreateBuckets,
  })

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => {
    setFilterString('')
  })

  useShortcut(SHORTCUT_IDS.STORAGE_BUCKETS_REFRESH, onRefresh)

  useShortcut(
    SHORTCUT_IDS.STORAGE_BUCKETS_CLEAR_SORT,
    () => setSortBucket(STORAGE_BUCKET_SORT.CREATED_AT),
    { enabled: sortBucket !== STORAGE_BUCKET_SORT.CREATED_AT }
  )
}
