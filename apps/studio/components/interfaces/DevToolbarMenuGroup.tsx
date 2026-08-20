import { useDevToolbar } from 'dev-tools'
import { Activity } from 'lucide-react'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from 'ui'

export function DevToolbarMenuGroup() {
  const { isAvailable, enableToolbar, setIsOpen } = useDevToolbar()

  if (!isAvailable) return null

  const handleOpenDevToolbar = () => {
    enableToolbar()
    setIsOpen(true)
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>Local tools</DropdownMenuLabel>
        <DropdownMenuItem className="flex gap-2 cursor-pointer" onSelect={handleOpenDevToolbar}>
          <Activity size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          Dev toolbar
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  )
}
