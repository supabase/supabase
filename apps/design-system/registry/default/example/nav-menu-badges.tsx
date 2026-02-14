import Link from 'next/link'
import { Badge, NavMenu, NavMenuItem } from 'ui'

export default function NavMenuWithIcons() {
  return (
    <NavMenu>
      <NavMenuItem active={true}>
        <Link href="#" className="inline-flex items-center gap-2">
          Buckets
          <Badge variant="default">10</Badge>
        </Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#" className="inline-flex items-center gap-2">
          Policies <Badge variant="default">2</Badge>
        </Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#" className="inline-flex items-center gap-2">
          Settings
        </Link>
      </NavMenuItem>
    </NavMenu>
  )
}
