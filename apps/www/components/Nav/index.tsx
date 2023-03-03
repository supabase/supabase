import React, { useState } from 'react'
import Link from 'next/link'

import { Button, Badge, IconStar, IconChevronDown } from 'ui'
import FlyOut from '~/components/UI/FlyOut'
import Transition from 'lib/Transition'

import SolutionsData from 'data/Solutions.json'

import Solutions from '~/components/Nav/Product'
import Developers from '~/components/Nav/Developers'
import Announcement from '~/components/Nav/Announcement'

import { useTheme } from 'common/Providers'
import TextLink from '../TextLink'
import Image from 'next/image'
import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

const Nav = () => {
  const { isDarkMode } = useTheme()
  const [open, setOpen] = useState(false)

  const [openProduct, setOpenProduct] = useState(false)
  const [openDevelopers, setOpenDevelopers] = useState(false)

  React.useEffect(() => {
    if (open) {
      // Prevent scrolling on mount
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [open])

  function handleToggle(callback: any) {
    handleCancel()
    callback()
  }

  function handleCancel() {
    setOpenProduct(false)
    setOpenDevelopers(false)
  }

  const iconSections = Object.values(SolutionsData).map((solution: any, idx: number) => {
    const { name, description, icon, label, url } = solution

    const content = (
      <div className="flex mb-3 md:h-full lg:flex-col">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center w-10 h-10 text-white bg-gray-800 rounded-md dark:bg-white dark:text-gray-800 sm:h-12 sm:w-12">
            {/* <!-- Heroicon name: chart-bar --> */}
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
        </div>
        <div className="ml-4 md:flex md:flex-1 md:flex-col md:justify-between lg:ml-0 lg:mt-4">
          <div>
            <p className="space-x-2 text-base font-medium text-gray-900 dark:text-white">
              <span>{name}</span>
              {label && (
                <Badge dot color="green">
                  {label}
                </Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-scale-1100 dark:text-dark-100">{description}</p>
          </div>
          {url && (
            <p className="mt-2 text-sm font-medium text-brand-900 lg:mt-4">
              <TextLink label={label ? 'Get notified' : 'Learn more'} url={url} />
            </p>
          )}
        </div>
      </div>
    )
    return url ? (
      <Link href={url} key={`solution_${idx}`}>
        <a className="flex flex-col justify-between p-3 my-2 -m-3 transition duration-150 ease-in-out rounded-lg dark:hover:bg-scale-600 hover:bg-gray-50">
          {content}
        </a>
      </Link>
    ) : (
      <div
        key={`solution_${idx}`}
        className="flex flex-col justify-between p-3 -m-3 transition duration-150 ease-in-out rounded-lg"
      >
        {content}
      </div>
    )
  })

  type HamburgerButtonProps = {
    toggleFlyOut: Function
  }

  const HamburgerButton = (props: HamburgerButtonProps) => (
    <div
      className="absolute inset-y-0 left-0 flex items-center px-2 lg:hidden"
      onClick={() => props.toggleFlyOut()}
    >
      <button
        className="inline-flex items-center justify-center p-2 rounded-md text-scale-900 focus:ring-brand-900 dark:bg-scale-200 dark:hover:bg-scale-300 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-inset"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>

        <svg
          className="block w-6 h-6"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>

        <svg
          className="hidden w-6 h-6"
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
  )

  const FlyOutNavButton = (props: any) => (
    <div
      className={
        `
        text-scale-1200 hover:text-brand-900
        inline-flex cursor-pointer items-center
        border-b-2
        border-transparent
        px-1
        text-sm font-medium
        transition-colors
                ` + props.active
      }
      onClick={props.onClick}
    >
      <>
        <span>{props.title}</span>
        <div
          className={
            'text-scale-900 group-hover:text-scale-900 ml-2 flex h-5 w-5 items-center justify-center transition duration-150 ease-in-out' +
            (props.active && ' rotate-180 transform transition-all duration-100')
          }
        >
          <IconChevronDown size={14} strokeWidth={2} />
        </div>
      </>
    </div>
  )

  return (
    <>
      {/* <Announcement /> */}
      <div className="sticky top-0 z-50">
        <div className="absolute top-0 w-full h-full bg-scale-200 opacity-80"></div>
        <nav className="border-b border-scale-400 backdrop-blur-sm">
          {/* <div className="relative flex justify-between h-16 mx-auto lg:container lg:px-10 xl:px-0"> */}
          <div className="relative flex justify-between h-16 mx-auto lg:container lg:px-16 xl:px-20">
            <HamburgerButton toggleFlyOut={() => setOpen(true)} />
            <div className="flex items-center justify-center flex-1 sm:items-stretch lg:justify-between">
              <div className="flex items-center">
                <div className="flex items-center flex-shrink-0">
                  <Link href="/" as="/">
                    <a className="block w-auto h-6">
                      <Image
                        src={isDarkMode ? supabaseLogoWordmarkDark : supabaseLogoWordmarkLight}
                        width={124}
                        height={24}
                        alt="Supabase Logo"
                        priority
                      />
                    </a>
                  </Link>
                </div>
                <div className="hidden pl-4 sm:ml-6 sm:space-x-4 lg:flex">
                  <FlyOutNavButton
                    title={'Product'}
                    onClick={() => handleToggle(() => setOpenProduct(!openProduct))}
                    active={openProduct}
                  />
                  <FlyOutNavButton
                    title={'Developers'}
                    onClick={() => handleToggle(() => setOpenDevelopers(!openDevelopers))}
                    active={openDevelopers}
                  />
                  <Link href="/pricing">
                    <a
                      className={`
                        text-scale-1200 hover:text-brand-900 hover:border-brand-900 dark:text-dark-100 dark:hover:border-dark-100 inline-flex items-center
                        border-b-2 border-transparent p-5 px-1
                        text-sm font-medium
                      `}
                    >
                      Pricing
                    </a>
                  </Link>
                  <Link href="/blog">
                    <a
                      className={`
                        text-scale-1200 hover:text-brand-900 hover:border-brand-900 dark:text-dark-100 dark:hover:border-dark-100 inline-flex items-center
                        border-b-2 border-transparent p-5 px-1
                        text-sm font-medium
                      `}
                    >
                      Blog
                    </a>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  as="a"
                  className="hidden group lg:flex"
                  // @ts-ignore
                  href="https://github.com/supabase/supabase"
                  target="_blank"
                  type="text"
                  icon={
                    <div className="flex items-center justify-center w-4 h-4 text-brand-800">
                      <div className="flex items-center justify-center w-3 h-3 transition-all text-scale-900 group-hover:h-4 group-hover:w-4 group-hover:text-yellow-900 group-focus:h-4 group-focus:w-4 group-focus:text-yellow-900">
                        <IconStar strokeWidth={2} />
                      </div>
                    </div>
                  }
                >
                  Star us on GitHub
                </Button>

                <Link href="https://app.supabase.com/">
                  <a>
                    <Button type="default" className="hidden lg:block">
                      Sign in
                    </Button>
                  </a>
                </Link>
                <Link href="https://app.supabase.com/">
                  <a>
                    <Button className="hidden text-white lg:block">Start your project</Button>
                  </a>
                </Link>
              </div>
            </div>
            {/* <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"></div> */}
          </div>
          {/* </div> */}
          {/* Mobile Nav Menu */}
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
            <div className="fixed z-50 w-screen h-screen p-4 overflow-y-scroll transform bg-white dark:bg-scale-300 -inset-y-0 md:p-8">
              <div className="absolute items-center justify-between right-4 top-4">
                <div className="-mr-2">
                  <button
                    onClick={() => setOpen(false)}
                    type="button"
                    className="inline-flex items-center justify-center p-2 bg-white rounded-md text-scale-900 focus:ring-brand-900 dark:bg-scale-300 dark:hover:bg-scale-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset"
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
              {/* </div> */}
              <div className="mt-6 mb-12">
                <div className="pt-2 pb-4 space-y-1">
                  <Link href="https://app.supabase.com/">
                    <a className="block pl-3 pr-4 text-base font-medium text-scale-900 dark:text-white">
                      Sign in
                    </a>
                  </Link>
                </div>
                <div className="pt-2 pb-4 space-y-1">
                  <Link href="/docs">
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      Developers
                    </a>
                  </Link>
                  <Link href="/company">
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      Company
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      Pricing
                    </a>
                  </Link>

                  <Link href="https://github.com/supabase/supabase">
                    <a
                      target="_blank"
                      className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                    >
                      GitHub
                    </a>
                  </Link>
                  <Link href="/blog">
                    <a
                      target="_blank"
                      className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                    >
                      Blog
                    </a>
                  </Link>
                </div>
                <div className="p-3">
                  <p className="mb-6 text-sm text-scale-900">Products available:</p>
                  {iconSections}
                </div>
              </div>
            </div>
          </Transition>
        </nav>
        <FlyOut open={openProduct} handleCancel={handleCancel}>
          <Solutions />
        </FlyOut>
        <FlyOut open={openDevelopers} handleCancel={handleCancel}>
          <Developers />
        </FlyOut>
      </div>
    </>
  )
}

export default Nav
