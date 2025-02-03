'use client'

import { ProductMenuGroup, ProductMenuGroupItem } from 'components/ui/ProductMenu/ProductMenu.types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, ReactNode } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import {
  generateDatabaseMenu,
  generatePostgresItemsMenu,
} from '../DatabaseLayout/DatabaseMenu.utils'
import { generateAuthMenu, generateAuthPageMenu } from './AuthLayout.utils'
import { useParams } from 'common'
import { generateStoragePageItemsMenu } from '../StorageLayout/StorageLayout.utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { generateAdvisorsPageItemsMenu } from '../AdvisorsLayout/AdvisorsLayout.utils'

export function ProjectPageNavigation({ children, navKey }: PropsWithChildren<{ navKey: string }>) {
  const params = useParams()
  const pathname = usePathname()

  const ref = params.ref as string

  let items: ProductMenuGroupItem[] = []

  const postgresItemsMenu = generatePostgresItemsMenu(ref as string)
  const authMenu = generateAuthPageMenu(ref as string)
  const storagePageItemsMenu = generateStoragePageItemsMenu(ref as string)
  const advisorsPageItemsMenu = generateAdvisorsPageItemsMenu(ref as string)

  switch (navKey) {
    case 'auth':
      items = authMenu
      break
    case 'postgres-items':
      items = postgresItemsMenu
      break
    case 'storage':
      items = storagePageItemsMenu
      break
    case 'advisors':
      items = advisorsPageItemsMenu
      break
    default:
      items = []
  }

  return (
    <>
      <NavMenu className="px-5 pt-1 bg-dash-sidebar [&_ul]:gap-4">
        {items.map((item) => {
          const childIsActive = params[item.childId] && pathname?.includes(item.url)

          return (
            <>
              <Link href={item.url}>
                <NavMenuItem
                  active={!childIsActive && pathname?.includes(item.url)}
                  className="py-2 text-sm"
                >
                  {item.name}
                </NavMenuItem>
              </Link>
              <AnimatePresence>
                {item.hasChild && params[item.childId] && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -10, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 'auto' }}
                      exit={{ opacity: 0, x: -10, width: 0 }}
                      transition={{ duration: 0.12, delay: 0.05 }}
                      className="flex items-center -ml-2"
                    >
                      <ChevronRight
                        size={14}
                        className="text-foreground-muted mr-2 flex-shrink-0"
                      />
                      <NavMenuItem active={true} className="flex items-center gap-2">
                        {item.childIcon}
                        <Link href={`${item.url}/${params.childId}`}>{params[item.childId]}</Link>
                      </NavMenuItem>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          )
        })}
      </NavMenu>
      {children}
    </>
  )
}
