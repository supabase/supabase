import React, { Dispatch, SetStateAction } from 'react'
import Transition from 'lib/Transition'
import Link from 'next/link'
import { Accordion, Button } from 'ui'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  menu: any
}

const MobileMenu = ({ open, setOpen, menu }: Props) => {
  return (
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
          'dark:bg-scale-300 fixed overflow-y-auto inset-0 z-50 h-screen max-h-screen w-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh] transform bg-white',
          open && '!bg-scale-300',
        ].join(' ')}
      >
        <div className="absolute items-center justify-between right-4 top-4">
          <div className="-mr-2">
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
        </div>
        <div className="max-h-screen overflow-y-auto p-4">
          <div className="mt-10 mb-20 space-y-1">
            <Accordion
              type="default"
              openBehaviour="multiple"
              size="large"
              className="py-2 space-y-1"
              justified={false}
              chevronAlign="right"
            >
              {menu.primaryNav.map((menuItem: any) =>
                menuItem.hasDropdown ? (
                  <Accordion.Item
                    header={menuItem.title}
                    key={menuItem.title}
                    id={menuItem.title}
                    className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                  >
                    <div className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      submenu
                    </div>
                  </Accordion.Item>
                ) : (
                  <Link href={menuItem.url}>
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      {menuItem.title}
                    </a>
                  </Link>
                )
              )}
              {menu.primaryNav.map((menuItem: any) =>
                menuItem.hasDropdown ? (
                  <Accordion.Item
                    header={menuItem.title}
                    key={menuItem.title}
                    id={menuItem.title}
                    className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                  >
                    <div className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      submenu
                    </div>
                  </Accordion.Item>
                ) : (
                  <Link href={menuItem.url}>
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      {menuItem.title}
                    </a>
                  </Link>
                )
              )}
              {menu.primaryNav.map((menuItem: any) =>
                menuItem.hasDropdown ? (
                  <Accordion.Item
                    header={menuItem.title}
                    key={menuItem.title}
                    id={menuItem.title}
                    className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                  >
                    <div className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      submenu
                    </div>
                  </Accordion.Item>
                ) : (
                  <Link href={menuItem.url}>
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      {menuItem.title}
                    </a>
                  </Link>
                )
              )}
              {menu.primaryNav.map((menuItem: any) =>
                menuItem.hasDropdown ? (
                  <Accordion.Item
                    header={menuItem.title}
                    key={menuItem.title}
                    id={menuItem.title}
                    className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                  >
                    <div className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      submenu
                    </div>
                  </Accordion.Item>
                ) : (
                  <Link href={menuItem.url}>
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      {menuItem.title}
                    </a>
                  </Link>
                )
              )}
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
  )
}

export default MobileMenu
