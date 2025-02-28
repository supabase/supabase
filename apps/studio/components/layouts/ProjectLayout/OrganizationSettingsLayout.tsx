import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import { useNewLayout } from 'hooks/ui/useNewLayout'
import { cn, NavMenu, NavMenuItem } from 'ui'
import { ScaffoldContainerLegacy, ScaffoldTitle } from '../Scaffold'

function OrganizationSettingsLayout({ children }: PropsWithChildren) {
  const newLayoutPreview = useNewLayout()

  const { slug } = useParams()
  const currentPath = useCurrentPath()

  // hide these settings in the new layout
  // when path equals `/org/${slug}/team`
  // or `/org/${slug}/integrations`
  // or `/org/${slug}/usage`
  // make the function
  const isHidden = (path: string) => {
    return (
      newLayoutPreview &&
      (path === `/org/${slug}/team` ||
        path === `/org/${slug}/integrations` ||
        path === `/org/${slug}/usage`)
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
    !newLayoutPreview && {
      label: 'Team',
      href: `/org/${slug}/team`,
    },
    !newLayoutPreview && {
      label: 'Integrations',
      href: `/org/${slug}/integrations`,
    },
    {
      label: 'Billing',
      href: `/org/${slug}/billing`,
    },
    !newLayoutPreview && {
      label: 'Usage',
      href: `/org/${slug}/usage`,
    },
    {
      label: 'Invoices',
      href: `/org/${slug}/invoices`,
    },
    {
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
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
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Organization Settings</ScaffoldTitle>
      </ScaffoldContainerLegacy>
      <NavMenu
        className={cn(
          '[&_ul]:mx-auto [&_ul]:max-w-[1200px] [&_ul]:px-6 [&_ul]:lg:px-14 [&_ul]:xl:px-24 [&_ul]:2xl:px-32'
        )}
        aria-label="Organization menu navigation"
      >
        {(navMenuItems.filter(Boolean) as { label: string; href: string }[]).map((item) => (
          <NavMenuItem key={item.label} active={currentPath === item.href}>
            <Link href={item.href}>{item.label}</Link>
          </NavMenuItem>
        ))}
      </NavMenu>
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </>
  )
}

export default OrganizationSettingsLayout
