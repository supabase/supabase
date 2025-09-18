import { Clipboard, Trash } from 'lucide-react'
import { Item, ItemParams, Menu } from 'react-contexify'
import { toast } from 'sonner'

import { User } from 'data/auth/users-infinite-query'
import { copyToClipboard, DialogSectionSeparator } from 'ui'
import { USER_CONTEXT_MENU_ID } from './Users.constants'

interface UserContextMenuProps {
  onDeleteUser: (user: User) => void
}

export const UserContextMenu = ({ onDeleteUser }: UserContextMenuProps) => {
  const onSelectCopyCell = (p: ItemParams) => {
    const { user, column } = p.props
    const value = user[column.id]
    copyToClipboard(value ?? '-')
    toast.success(
      `Copied user's ${column.name === 'UID' ? column.name : column.name.toLowerCase()} to clipboard`
    )
  }

  const onSelectDeleteUser = (p: ItemParams) => {
    if (p.props.user) onDeleteUser(p.props.user)
  }

  return (
    <Menu id={USER_CONTEXT_MENU_ID} animation={false} className="!min-w-36">
      <Item onClick={onSelectCopyCell} data="copy">
        <Clipboard size={12} />
        <span className="ml-2 text-xs">Copy value</span>
      </Item>
      <DialogSectionSeparator className="" />
      <Item onClick={onSelectDeleteUser} data="delete">
        <Trash size={12} />
        <span className="ml-2 text-xs">Delete user</span>
      </Item>
    </Menu>
  )
}
