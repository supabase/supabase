'use client'

import { useConfig } from '@/src/hooks/use-config'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'
import { useHoverControls } from './side-nav-hover-context'
import { motion } from 'framer-motion'

export default function SideNavMenuIcon({ product }: { product: any }) {
  const { org } = useParams()
  const [config] = useConfig()
  const { selectedOrg, selectedProject, stickySidebar } = config
  const pathname = usePathname()

  const isActive =
    pathname.startsWith(`/${org}/${selectedProject?.key}${product.href}`) ||
    pathname.startsWith(`/${org}${product.href}`)

  // console.log('config.tableEditor.activeTabId', config.tableEditor.activeTabId)

  /**
   * Override href for settings product
   * Grabs project and organization from config to build friendly URL
   */
  let overrideHref = null
  if (product.name === 'settings') {
    overrideHref = `/${selectedOrg?.key}/${selectedProject?.key}/settings/project/general`
  }
  if (product.name === 'table-editor' && config.tableEditor.activeTabId) {
    overrideHref = `/${selectedOrg?.key}/${selectedProject?.key}/table-editor/${config.tableEditor.activeTabId}`
  }

  const { controls, isHovered } = useHoverControls()

  return (
    <Link
      key={product.name}
      href={overrideHref || `/${org}/${selectedProject?.key}${product.href}`}
      onClick={() => {
        controls.start('rest')
      }}
      className={cn('relative', 'w-full', 'group/nav-item-anchor', 'overflow-hidden')}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={cn(
          'absolute top-1/2 transform -translate-y-1/2 h-2 w-[3px] rounded-r-full duration-500',
          'group-hover/nav-item-anchor:bg-foreground-muted group-hover/nav-item-anchor:left-0',
          isActive ? '!bg-foreground left-0 w-[5px] duration-100' : '-left-1',
          'transition-all'
        )}
      ></div>
      <div className={cn('flex flex-row items-center')}>
        <div className={cn('w-[64px]', 'flex justify-center items-center')}>{product.icon}</div>
        <motion.span
          animate={controls}
          initial="rest"
          variants={
            !stickySidebar
              ? {
                  rest: { opacity: 0, x: 48, display: 'none' },
                  hover: { opacity: 100, x: 64, display: 'block' },
                }
              : {
                  rest: { opacity: 100, x: 64, display: 'block' },
                }
          }
          transition={{ ease: 'easeInOut', duration: 0.1, delay: 0.2 }}
          className={
            cn(
              !stickySidebar && 'hidden',
              'absolute w-[250px]',
              'text-sm',
              'group-hover/nav-item-anchor:text-foreground',
              isActive ? 'text-foreground' : 'text-foreground-light'
            )
            // 'w-[250px]',
            // 'hidden',
            // 'overflow-auto',
            // isHovered && 'visible opacity-100 block',
            // 'transition-all'
          }
        >
          {product.label}
        </motion.span>
      </div>
      <div></div>

      {/* <span className="text-xs mt-1">{product.label}</span> */}
    </Link>
  )
}
