import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dispatch, Fragment, SetStateAction, useEffect } from 'react'
import { useKey } from 'react-use'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Accordion, Button, cn } from 'ui'
import { ThemeToggle } from 'ui-patterns'

import type { DropdownMenuItem } from '../Navigation.types'
import { MenuItem, useActiveMenuLabel } from './GlobalNavigationMenu'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'
import { X } from 'lucide-react'

const DEFAULT_EASE = [0.24, 0.25, 0.05, 1]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15, staggerChildren: 0.05, ease: DEFAULT_EASE } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: DEFAULT_EASE } },
  exit: { opacity: 0, transition: { duration: 0.05 } },
}

const itemClassName =
  'block py-2 pl-2 pr-3.5 text-sm text-foreground-light hover:bg-surface-200 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:rounded'

const AccordionMenuItem = ({ section }: { section: DropdownMenuItem[] }) => {
  const activeLabel = useActiveMenuLabel(GLOBAL_MENU_ITEMS)

  return (
    <m.div
      variants={listItem}
      className="border-b border-muted [&>div]:!rounded-none [&_div[data-state=open]>div]:py-1"
      key={section[0].label}
    >
      {section[0].menuItems ? (
        <Accordion.Item
          header={section[0].label}
          id={section[0].label}
          className={cn(
            'relative',
            activeLabel === section[0].label && '!text-foreground',
            itemClassName
          )}
        >
          {section[0].menuItems?.map((menuItem, menuItemIndex) => (
            <Fragment key={`desktop-docs-menu-section-${menuItemIndex}`}>
              {menuItem.map((item) =>
                !item.href ? (
                  <div className="font-mono tracking-wider flex items-center text-foreground-muted text-xs uppercase rounded-md p-2 leading-none">
                    {item.label}
                  </div>
                ) : (
                  <MenuItem
                    href={item.href}
                    title={item.label}
                    community={item.community}
                    icon={item.icon}
                  />
                )
              )}
            </Fragment>
          ))}
        </Accordion.Item>
      ) : (
        <Link
          href={section[0].href}
          className={cn(activeLabel === section[0].label && '!text-foreground', itemClassName)}
        >
          {section[0].label}
        </Link>
      )}
    </m.div>
  )
}

const Menu = () => (
  <Accordion
    type="default"
    openBehaviour="multiple"
    size="small"
    className="space-y-1 mt-2.5"
    justified
    chevronAlign="right"
  >
    {GLOBAL_MENU_ITEMS.map((section) => (
      <AccordionMenuItem section={section} />
    ))}
  </Accordion>
)
interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

const GlobalMobileMenu = ({ open, setOpen }: Props) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useKey('Escape', () => setOpen(false))

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        {open && (
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-overlay fixed overflow-hidden inset-0 z-50 h-screen max-h-screen w-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh] transform"
          >
            <div className="absolute px-5 h-[var(--header-height)] flex items-center justify-between w-screen left-0 top-0 z-50 bg-overlay before:content[''] before:absolute before:w-full before:h-3 before:inset-0 before:top-full before:bg-gradient-to-b before:from-background-overlay before:to-transparent">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  className="cursor-pointer hidden dark:block"
                  src="/docs/supabase-dark.svg"
                  priority
                  width={96}
                  height={24}
                  alt="Supabase Logo"
                />
                <Image
                  className="cursor-pointer block dark:hidden"
                  src="/docs/supabase-light.svg"
                  priority
                  width={96}
                  height={24}
                  alt="Supabase Logo"
                />
                <span className="font-mono text-sm font-medium text-brand-link mb-px">DOCS</span>
              </Link>
              <div className="flex gap-4 items-center">
                <ThemeToggle contentClassName="bg-surface-200" />
                <button
                  onClick={() => setOpen(false)}
                  type="button"
                  className="inline-flex items-center justify-center focus:ring-brand bg-surface-100 hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-inset border border-default bg-surface-100/75 text-foreground-light rounded min-w-[30px] w-[30px] h-[30px]"
                >
                  <span className="sr-only">Close menu</span>
                  <X />
                </button>
              </div>
            </div>
            <div className="max-h-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh] overflow-y-auto pt-12 pb-32 px-3">
              <Menu />
            </div>
            <div className="absolute bottom-0 left-0 right-0 top-auto w-full bg-alternative flex items-stretch p-4 gap-4">
              {!isUserLoading && (
                <>
                  {isLoggedIn ? (
                    <Button block size="medium" asChild>
                      <Link href="/dashboard/projects">Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button block size="medium" type="default" asChild>
                        <Link href="https://supabase.com/dashboard/sign-in">Sign in</Link>
                      </Button>
                      <Button block size="medium" asChild>
                        <Link href="https://supabase.com/dashboard/new">Start your project</Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {open && (
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-alternative fixed overflow-hidden inset-0 z-40 h-screen w-screen transform"
          />
        )}
      </AnimatePresence>
    </LazyMotion>
  )
}

export default GlobalMobileMenu
