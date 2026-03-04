import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useWindowSize } from 'react-use'

import { navData as DevelopersData } from 'data/Solutions'

type LinkProps = {
  text: string
  description?: string
  url?: string
  icon?: any
  svg?: any
}

export const SolutionsDropdown = () => (
  <div className="flex flex-col xl:flex-row">
    <div className="w-[550px] xl:w-[600px] py-8 px-8 bg-background grid gap-3 grid-cols-2 xl:grid-cols-3">
      {/* Skill Level, Who it's for, App Type */}
      {DevelopersData['navigation'].slice(0, 3).map((column) => (
        <LinksGroup key={column.label} links={column.links} label={column.label} />
      ))}
    </div>

    <div className="bg-surface-75 flex flex-col w-[550px] xl:w-[480px] border-t xl:border-t-0 xl:border-l">
      <div className="flex flex-col gap-6 py-8 px-10">
        <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
          {DevelopersData['navigation'][3].label}
        </label>

        <div className="flex flex-col gap-4">
          {DevelopersData['navigation'][3].links.map((link) => (
            <MigrationLinkCard key={link.text} link={link} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

const LinksGroup = ({ links, label }: { links: LinkProps[]; label: string }) => {
  return (
    <div key={label} className="p-0 flex flex-col gap-6">
      <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
        {label}
      </label>
      <ul className="flex flex-col gap-4">
        {links.map(({ icon: Icon, ...link }: LinkProps) => (
          <li key={link.text}>
            <Link
              href={link.url!}
              className="flex group items-center gap-2 text-foreground-light text-sm hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:outline-none focus-visible:rounded focus-visible:ring-foreground-lighter"
            >
              {Icon && <Icon size={16} strokeWidth={1.3} />}
              <span>{link.text}</span>
              <ChevronRight
                strokeWidth={2}
                className="w-3 -ml-1 transition-all will-change-transform -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const MotionLink = motion(Link)

const MigrationLinkCard = ({ link }: { link: LinkProps }) => {
  const [hovered, setHovered] = useState(false)
  const { width } = useWindowSize()
  const isDesktop = width >= 1280

  return (
    <MotionLink
      href={link.url!}
      className="bg-background p-3 rounded-md border flex items-center gap-4 group overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      layout
    >
      <AnimatePresence mode="popLayout">
        {(hovered || !isDesktop) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: isDesktop ? 0.2 : 0, ease: 'easeInOut' }}
            layout
          >
            {link.icon && <link.icon className="size-6" />}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="size-6 flex items-center justify-center"
        layout
        transition={{ duration: isDesktop ? 0.2 : 0, ease: 'easeInOut' }}
      >
        <ArrowLeftRight className="size-4 text-foreground-light" strokeWidth={1.3} />
      </motion.div>

      <motion.div
        className="flex items-center gap-1"
        layout
        transition={{ duration: isDesktop ? 0.2 : 0, ease: 'easeInOut' }}
      >
        <span className="text-base font-medium">{link.text}</span>
      </motion.div>

      <motion.div
        layout
        transition={{ duration: isDesktop ? 0.2 : 0, ease: 'easeInOut' }}
        className="ml-auto"
      >
        <ChevronRight
          strokeWidth={2}
          className="w-3 transition-all will-change-transform -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
        />
      </motion.div>
    </MotionLink>
  )
}
