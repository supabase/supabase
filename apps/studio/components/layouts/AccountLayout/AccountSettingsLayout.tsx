import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'

import { Button, cn } from 'ui'
import { ScaffoldContainerLegacy } from '../Scaffold'

export const AccountSettingsLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()
  const links = [
    {
      isActive: pathname === `/account/me`,
      label: 'Preferences',
      href: `/account/me`,
      key: `/account/me`,
    },
    {
      isActive: pathname === `/account/tokens`,
      label: 'Access Tokens',
      href: `/account/tokens`,
      key: `/account/tokens`,
    },

    {
      isActive: pathname === `/account/security`,
      label: 'Security',
      href: `/account/security`,
      key: `/account/security`,
    },
  ]

  return (
    <ScaffoldContainerLegacy className="flex flex-row py-8 gap-20">
      <nav className="py-0">
        <ul className="flex flex-col gap-1">
          {links.map((link, i) => (
            <li key={`${link.key}-${i}`}>
              <Link href={link.href}>
                <Button
                  type={link.isActive ? 'default' : 'text'}
                  className={cn(
                    'border-0',
                    link.isActive
                      ? 'bg-selection text-foreground'
                      : 'hover:bg-overlay-hover text-foreground-lighter'
                  )}
                >
                  {link.label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 flex-grow">{children}</div>
    </ScaffoldContainerLegacy>
  )
}
