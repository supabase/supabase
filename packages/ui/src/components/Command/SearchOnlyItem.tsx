import { CommandItem } from './Command.utils'

export default function SearchOnlyItem({ children, isSubItem, ...props }: any) {
  return <CommandItem {...props}>{children}</CommandItem>
}
