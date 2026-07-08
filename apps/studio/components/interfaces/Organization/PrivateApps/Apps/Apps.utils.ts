import type { PrivateApp } from '../PrivateApps.types'
import type { AppsSort } from './Apps.types'

export function handleSortChange(
  currentSort: AppsSort,
  column: string,
  setSort: (s: AppsSort) => void
) {
  const [currentCol, currentOrder] = currentSort.split(':')
  if (currentCol === column) {
    setSort(`${column}:${currentOrder === 'asc' ? 'desc' : 'asc'}` as AppsSort)
  } else {
    setSort(`${column}:asc` as AppsSort)
  }
}

export function sortApps(apps: PrivateApp[], sort: AppsSort): PrivateApp[] {
  const [, order] = sort.split(':')
  return [...apps].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return order === 'asc' ? diff : -diff
  })
}
