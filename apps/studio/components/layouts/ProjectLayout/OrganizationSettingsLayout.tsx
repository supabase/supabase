import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import { NavMenu, NavMenuItem } from 'ui'
import { ScaffoldContainerLegacy, ScaffoldTitle } from '../Scaffold'

function OrganizationSettingsLayout({ children }: PropsWithChildren) {
  const { slug } = useParams()
  // Get the path without any hash values
  const fullCurrentPath = useCurrentPath()
  const [currentPath] = fullCurrentPath.split('#')

  // Hide these settings in the new layout on the following paths
  const isHidden = (path: string) => {
    return (
      path === `/org/${slug}/team` ||
      path === `/org/${slug}/integrations` ||
      path === `/org/${slug}/usage` ||
      path === `/org/${slug}/billing`
    )
  }

  if (isHidden(currentPath)) {
    return children
  }

  const navMenuItems = [
    {
      label: 'General',
      href: `/org/${slug}/general`,
    },
    {
      label: 'Security',
      href: `/org/${slug}/security`,
    },
    {
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
    },

    {
      label: 'SSO',
      href: `/org/${slug}/sso`,
    },

    {
      label: 'Audit Logs',
      href: `/org/${slug}/audit`,
    },
    {
      label: 'Legal Documents',
      href: `/org/${slug}/documents`,
    },
  ]

  return (
    <>
      <ScaffoldContainerLegacy className="mb-0">
        <ScaffoldTitle>Organization Settings</ScaffoldTitle>
        <NavMenu className="overflow-x-auto" aria-label="Organization menu navigation">
          {(navMenuItems.filter(Boolean) as { label: string; href: string }[]).map((item) => (
            <NavMenuItem key={item.label} active={currentPath === item.href}>
              <Link href={item.href}>{item.label}</Link>
            </NavMenuItem>
          ))}
        </NavMenu>
      </ScaffoldContainerLegacy>
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </>
  )
}

export default OrganizationSettingsLayout
