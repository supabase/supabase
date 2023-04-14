import { useCommandState } from 'cmdk-supabase'
import { CommandItem } from './Command.utils'

export default function SearchOnlyItem({ children, isSubItem, ...props }: any) {
  const search = useCommandState((state) => state.search)
  // if search is empty & items is marked as a subItem, don't show it
  // ie: only show these items in search results, not top level
  if (!search && isSubItem) return null
  return <CommandItem {...props}>{children}</CommandItem>
}
