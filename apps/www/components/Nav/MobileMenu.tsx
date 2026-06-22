'use client'

import { type Menu } from '~/data/nav'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, cn } from 'ui'
import { TextLink } from 'ui-patterns/TextLink'

import MenuItem from './MenuItem'
import SupabaseWordmark from './SupabaseWordmark'
import staticContent from '@/.generated/staticContent/_index.json'
import ProductModulesData from '@/data/ProductModules'
import { DEFAULT_EASE } from '@/lib/animations'
import { useSendTelemetryEvent } from '@/lib/telemetry'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  menu: Menu
}

export const MobileMenu = ({ open, setOpen, menu }: Props) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { jobsCount } = staticContent

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])

  const AccordionMenuItem = ({ menuItem }: { menuItem: Menu['primaryNav'][number] }) => (
    <AccordionContent className="p-0">
      {menuItem.title === 'Product' ? (
        <>
          {Object.values(menuItem.subMenu)?.map((component) => (
            <MenuItem
              key={component.name}
              title={component.name}
              href={component.url}
              description={component.description_short}
              icon={component.icon}
              onClick={() => setOpen(false)}
            />
          ))}
          <div>
            <div className="group flex items-center p-2 text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              Modules
            </div>
            <ul className="flex flex-col gap-0">
              {Object.values(ProductModulesData).map((productModule) => (
                <MenuItem
                  key={productModule.name}
                  title={productModule.name}
                  href={productModule.url}
                  description={productModule.description_short}
                  icon={productModule.icon}
                  onClick={() => setOpen(false)}
                />
              ))}
            </ul>
          </div>
          <Link
            href="/features"
            className="
              flex items-center justify-between group text-sm
              p-4 mt-4 gap-2
              rounded-lg border
              bg-alternative-200 text-foreground-light
              hover:text-foreground hover:border-foreground-muted
              focus-visible:text-foreground focus-visible:ring-2 focus-visible:outline-hidden
              focus-visible:rounded-sm focus-visible:ring-foreground-lighter
            "
            onClick={() => setOpen(false)}
          >
            <div className="flex flex-col gap-1 leading-3!">
              <span>Features</span>
              <span className="text-foreground-lighter text-xs leading-4">
                Explore everything you can do with Supabase.
              </span>
            </div>
            <ChevronRight
              strokeWidth={2}
              className="w-3 -ml-1 transition-all will-change-transform -translate-x-1 opacity-80 group-hover:translate-x-0 group-hover:opacity-100"
            />
          </Link>
        </>
      ) : menuItem.title === 'Developers' ? (
        <div className="px-3 mb-2 flex flex-col gap-6">
          {menuItem.subMenu['navigation'].map((column) => (
            <div key={column.label} className="flex flex-col gap-3">
              {column.label !== 'Developers' && (
                <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
                  {column.label}
                </label>
              )}
              {column.links.map((link) => (
                <TextLink
                  hasChevron={false}
                  key={link.text}
                  url={link.url}
                  label={link.text}
                  counter={link.text === 'Careers' && jobsCount > 0 ? jobsCount : undefined}
                  className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay mt-0!"
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
          ))}

          <div className="flex flex-col py-2">
            <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              Troubleshooting
            </label>
            <TextLink
              hasChevron={false}
              url={menuItem.subMenu['footer']['support'].url}
              label={menuItem.subMenu['footer']['support'].text}
              className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
              onClick={() => setOpen(false)}
            />
            <TextLink
              hasChevron={false}
              url={menuItem.subMenu['footer']['systemStatus'].url}
              label={menuItem.subMenu['footer']['systemStatus'].text}
              className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
              onClick={() => setOpen(false)}
            />
          </div>
        </div>
      ) : menuItem.title === 'Solutions' ? (
        <div className="px-3 mb-2 flex flex-col gap-6">
          {menuItem.subMenu['navigation'].map((column) => (
            <div key={column.label} className="flex flex-col gap-3">
              {column.label !== 'Solutions' && (
                <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
                  {column.label}
                </label>
              )}
              {column.links.map((link) => (
                <TextLink
                  hasChevron={false}
                  key={link.text}
                  url={link.url}
                  label={link.text}
                  className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay mt-0!"
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </AccordionContent>
  )

  const Menu = () => {
    const className = 'py-2 pl-2 pr-4 text-base font-medium text-foreground hover:bg-surface-200'
    return (
      <Accordion type="multiple" className="px-0">
        {menu.primaryNav.map((menuItem) => (
          <m.div
            key={menuItem.title}
            variants={listItem}
            className="border-b [&>div]:rounded-none!"
          >
            {menuItem.hasDropdown ? (
              <AccordionItem id={menuItem.title} value={menuItem.title} className="border-none">
                <AccordionTrigger className={className}>{menuItem.title}</AccordionTrigger>
                <AccordionMenuItem menuItem={menuItem} />
              </AccordionItem>
            ) : (
              <Link
                href={menuItem.url ?? '/'}
                className={cn(
                  className,
                  'block focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-foreground-lighter focus-visible:rounded-sm'
                )}
                onClick={() => setOpen(false)}
              >
                {menuItem.title}
              </Link>
            )}
          </m.div>
        ))}
      </Accordion>
    )
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        {open && (
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-overlay fixed overflow-hidden inset-0 z-50 h-screen max-h-screen w-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-svh transform"
          >
            <div className="absolute h-16 px-6 flex items-center justify-between w-screen left-0 top-0 z-50 bg-overlay before:content[''] before:absolute before:w-full before:h-3 before:inset-0 before:top-full before:bg-linear-to-b before:from-background-overlay before:to-transparent">
              <Link
                href="/"
                as="/"
                className="block w-auto h-6 focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-xs"
              >
                <SupabaseWordmark />
              </Link>
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-foreground-lighter focus:ring-brand hover:text-foreground-light transition-colors focus:outline-hidden focus:ring-2 focus:ring-inset"
              >
                <span className="sr-only">Close menu</span>
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-svh overflow-y-auto pt-20 pb-32 px-4">
              <Menu />
            </div>
            <div className="absolute bottom-0 left-0 right-0 top-auto w-full bg-alternative flex items-stretch p-4 gap-4">
              {!isUserLoading && (
                <>
                  {isLoggedIn ? (
                    <Link href="/dashboard/projects" passHref legacyBehavior>
                      <Button block asChild>
                        <a type={undefined} className="h-10 py-4">
                          Dashboard
                        </a>
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="https://supabase.com/dashboard"
                        passHref
                        legacyBehavior
                        onClick={() =>
                          sendTelemetryEvent({
                            action: 'sign_in_button_clicked',
                            properties: { buttonLocation: 'Mobile Nav' },
                          })
                        }
                      >
                        <Button block variant="default" asChild>
                          <a type={undefined} className="h-10 py-4">
                            Sign in
                          </a>
                        </Button>
                      </Link>
                      <Link
                        href="https://supabase.com/dashboard/sign-up"
                        passHref
                        legacyBehavior
                        onClick={() =>
                          sendTelemetryEvent({
                            action: 'start_project_button_clicked',
                            properties: { buttonLocation: 'Mobile Nav' },
                          })
                        }
                      >
                        <Button block asChild>
                          <a type={undefined} className="h-10 py-4">
                            Start your project
                          </a>
                        </Button>
                      </Link>
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
