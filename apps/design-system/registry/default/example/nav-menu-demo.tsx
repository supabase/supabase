import Link from 'next/link'
import { NavMenu, NavMenuItem } from 'ui'

export default function NavMenuDemo() {
  return (
    <NavMenu>
      <NavMenuItem active={true}>
        <Link href="#">Overview</Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#">Invocations</Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#">Logs</Link>
      </NavMenuItem>
      <NavMenuItem active={false}>
        <Link href="#">Code</Link>
      </NavMenuItem>
    </NavMenu>
  )
}
