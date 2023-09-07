import React, { Dispatch, SetStateAction } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Transition from 'lib/Transition'

import { Accordion, Button, TextLink } from 'ui'
import MenuItem from './MenuItem'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  isDarkMode: boolean
  menu: any
}

const MobileMenu = ({ open, setOpen, isDarkMode, menu }: Props) => {
  return (
    <>
      <Transition
        appear={true}
        show={open}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div
          className={[
            'bg-overlay fixed overflow-hidden inset-0 z-50 h-screen max-h-screen w-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh] transform',
          ].join(' ')}
        >
          <div className="absolute h-16 px-6 flex items-center justify-between w-screen left-0 top-0 z-50 bg-overlay">
            <Link href="/" as="/">
              <a className="block w-auto h-6">
                <Image
                  src={isDarkMode ? supabaseLogoWordmarkDark : supabaseLogoWordmarkLight}
                  width={124}
                  height={24}
                  alt="Supabase Logo"
                />
              </a>
            </Link>
            <button
              onClick={() => setOpen(false)}
              type="button"
              className="inline-flex items-center justify-center p-2 bg-white rounded-md text-scale-900 focus:ring-brand dark:bg-scale-300 dark:hover:bg-scale-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset"
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
          <div className="max-h-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh] overflow-y-auto py-8 px-4">
            <div className="mt-10 mb-20 space-y-1">
              <Accordion
                type="default"
                openBehaviour="multiple"
                size="large"
                className="py-2 space-y-1"
                justified={false}
                chevronAlign="right"
              >
                {menu.primaryNav.map((menuItem: any) => (
                  <div className="border-b [&>div]:!rounded-none" key={menuItem.title}>
                    {menuItem.hasDropdown ? (
                      <Accordion.Item
                        header={<div className="w-full flex-1">{menuItem.title}</div>}
                        id={menuItem.title}
                        className="block relative py-2 pl-3 pr-4 text-base font-medium text-foreground hover:bg-overlay-hover hover:border-gray-300"
                      >
                        {menuItem.title === 'Product' ? (
                          Object.values(menuItem.subMenu)?.map((component: any) => (
                            <MenuItem
                              key={component.name}
                              title={component.name}
                              href={component.url}
                              description={component.description_short}
                              icon={component.icon}
                            />
                          ))
                        ) : menuItem.title === 'Developers' ? (
                          <div className="px-3 mb-2 flex flex-col gap-4">
                            {menuItem.subMenu['navigation'].map((column: any) => (
                              <div key={column.label}>
                                {column.label !== 'Developers' && (
                                  <label className="text-muted text-xs uppercase tracking-widest font-mono">
                                    {column.label}
                                  </label>
                                )}
                                {column.links.map((link: any) => (
                                  <TextLink
                                    hasChevron={false}
                                    key={link.text}
                                    url={link.url}
                                    label={link.text}
                                    className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
                                  />
                                ))}
                              </div>
                            ))}

                            <div className="flex flex-col py-2">
                              <label className="text-muted text-xs uppercase tracking-widest font-mono">
                                Troubleshooting
                              </label>
                              <TextLink
                                hasChevron={false}
                                url={menuItem.subMenu['footer']['support'].url}
                                label={menuItem.subMenu['footer']['support'].text}
                                className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
                              />
                              <TextLink
                                hasChevron={false}
                                url={menuItem.subMenu['footer']['systemStatus'].url}
                                label={menuItem.subMenu['footer']['systemStatus'].text}
                                className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
                              />
                            </div>
                          </div>
                        ) : null}
                      </Accordion.Item>
                    ) : (
                      <Link href={menuItem.url}>
                        <a className="block py-2 pl-3 pr-4 text-base font-medium text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                          {menuItem.title}
                        </a>
                      </Link>
                    )}
                  </div>
                ))}
              </Accordion>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 top-auto w-full bg-alternative flex items-stretch p-4 gap-4">
            <Link href="https://supabase.com/dashboard" passHref>
              <Button block type="default" asChild>
                <a className="">Sign in</a>
              </Button>
            </Link>
            <Link href="https://supabase.com/dashboard" passHref>
              <Button block asChild>
                <a className="h-10 py-4">Start your project</a>
              </Button>
            </Link>
          </div>
        </div>
      </Transition>
      <Transition
        appear={true}
        show={open}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className="bg-alternative fixed overflow-hidden inset-0 z-40 h-screen w-screen transform" />
      </Transition>
    </>
  )
}

export default MobileMenu
