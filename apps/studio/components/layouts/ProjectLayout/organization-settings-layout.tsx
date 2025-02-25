import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { cn, NavMenu, NavMenuItem } from 'ui'
import { ScaffoldContainerLegacy, ScaffoldTitle } from '../Scaffold'

function OrganizationSettingsLayout({ children }: PropsWithChildren) {
  const currentPath = useCurrentPath()
  const { slug } = useParams()

  const navMenuItems = [
    {
      label: 'General',
      href: `/org/${slug}/settings/general`,
    },
    {
      label: 'Billing',
      href: `/org/${slug}/settings/billing`,
    },
    {
      label: 'Invoices',
      href: `/org/${slug}/settings/invoices`,
    },
    {
      label: 'Audit Logs',
      href: `/org/${slug}/settings/audit`,
    },
    {
      label: 'Legal Documents',
      href: `/org/${slug}/settings/documents`,
    },
  ]

  return (
    <>
      {/* <AnimatePresence>
        <motion.div
          className="px-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
        > */}
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Organization Settings</ScaffoldTitle>
      </ScaffoldContainerLegacy>
      <NavMenu
        className={cn(
          '[&_ul]:mx-auto [&_ul]:max-w-[1200px] [&_ul]:px-6 [&_ul]:lg:px-14 [&_ul]:xl:px-24 [&_ul]:2xl:px-32'
        )}
        aria-label="Organization menu navigation"
      >
        {navMenuItems.map((item) => (
          <NavMenuItem key={item.label} active={currentPath === item.href}>
            <Link href={item.href}>{item.label}</Link>
          </NavMenuItem>
        ))}
      </NavMenu>
      {/* </motion.div>
      </AnimatePresence> */}
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </>
  )
}

export default OrganizationSettingsLayout
