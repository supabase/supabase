import { useDevToolbar } from 'dev-tools'
import { DropdownMenuCheckboxItem, DropdownMenuGroup, DropdownMenuLabel } from 'ui'

export function DevToolbarMenuGroup() {
  const { isAvailable, isEnabled, enableToolbar, dismissToolbar } = useDevToolbar()

  if (!isAvailable) return null

  const handleToggleDevToolbar = (checked: boolean) => {
    if (checked) {
      enableToolbar()
      return
    }

    dismissToolbar()
  }

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Local tools</DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        checked={isEnabled}
        onCheckedChange={handleToggleDevToolbar}
        className="cursor-pointer"
      >
        Dev toolbar
      </DropdownMenuCheckboxItem>
    </DropdownMenuGroup>
  )
}
