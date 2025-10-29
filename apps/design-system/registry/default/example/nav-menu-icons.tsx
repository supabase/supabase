import Link from 'next/link'
import { ArchiveIcon, ShieldIcon, SettingsIcon } from 'lucide-react'
import { Badge, NavMenu, NavMenuItem } from 'ui'

export default function NavMenuWithIcons() {
  return (
    <NavMenu>
      <NavMenuItem active={true}>
        <Link href="#" className="inline-flex items-center gap-2">
          <ArchiveIcon size={14} />
          Buckets
          <Badge variant="default">10</Badge>
        </Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#" className="inline-flex items-center gap-2">
          <ShieldIcon size={14} />
          Policies
        </Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#" className="inline-flex items-center gap-2">
          <SettingsIcon size={14} />
          Settings
        </Link>
      </NavMenuItem>
    </NavMenu>
  )
}
