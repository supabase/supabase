import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Badge } from "@supabase/ui";
import FlyOut from '~/components/UI/FlyOut'
import Transition from 'lib/Transition'
import SolutionsData from 'data/Solutions.json'

import Solutions from '~/components/Nav/Product'
import Developers from './Developers'
import { Button, IconArrowRight } from '@supabase/ui'

import newsDetails from 'data/NavNews.json'

type Props = {
  darkMode: boolean
}

const Nav = (props: Props) => {
  const { basePath } = useRouter()
  const { darkMode } = props
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
          <div className="inline-flex items-center justify-center w-10 h-10 text-white bg-gray-800 rounded-md sm:h-12 sm:w-12">
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
        <div className="ml-4 md:flex-1 md:flex md:flex-col md:justify-between lg:ml-0 lg:mt-4">
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {name} {label && <Badge dot color="green">{label}</Badge>}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-100">{description}</p>
          </div>
          {url && (
            <p className="mt-2 text-sm font-medium text-brand-600 lg:mt-4">
              Learn more <span aria-hidden="true">&rarr;</span>
            </p>
          )}
        </div>
      </div>
    )
    return url ? (
      <a
        key={`solution_${idx}`}
        href={url}
        className="flex flex-col justify-between p-3 my-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 dark:hover:bg-dark-600"
      >
        {content}
      </a>
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
        className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-700"
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
      className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-dark-100 cursor-pointer"
      onClick={props.onClick}
    >
      <>
        <span>{props.title}</span>
        <svg
          className={`
            ml-2 h-5 w-5 text-gray-300 group-hover:text-gray-300 transition-transform transform ease-in-out duration-150 rotate-0 ${
              props.active ? 'rotate-180' : null
            }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </>
    </div>
  )

  type NewsProps = {
    news: News
  }

  type News = {
    show: boolean
    text: string
    link: NewsLink
  }

  type NewsLink = {
    text: string
    url: string
  }

  const News = (props: NewsProps) => (
    <div className="text-white bg-brand-700 dark:bg-gray-700">
      <div className="flex flex-col sm:flex-row items-center justify-center py-2 mx-auto space-x-2 lg:container lg:px-16 xl:px-20">
        <span>{props.news.text}</span>
        <a
          href={props.news.link.url}
          className="inline-flex space-x-1 items-center text-xs bg-brand-800 px-2 py-1 rounded-full transition-colors hover:bg-brand-900 dark:hover:bg-brand-700 hover:text-white hover:bg-opacity-70"
        >
          {props.news.link.text} <IconArrowRight size="tiny" />
        </a>
      </div>
    </div>
  )

  return (
    <React.Fragment>
      {newsDetails.show && <News news={newsDetails} />}
      <div className="sticky top-0 z-50">
        <nav className="bg-gray-50 border-b dark:bg-gray-600 dark:border-gray-500">
          <div className="relative flex justify-between h-16 mx-auto lg:container lg:px-16 xl:px-20">
            <HamburgerButton toggleFlyOut={() => setOpen(true)} />
            <div className="flex items-center justify-center flex-1 sm:items-stretch lg:justify-between">
              <div className="flex items-center">
                <div className="flex items-center flex-shrink-0">
                  <Link href="/" as="/">
                    <img
                      className="block w-auto h-6"
                      src={darkMode ? `/new/images/logo-dark.png` : `/new/images/logo-light.png`}
                      alt="Logo"
                    />
                  </Link>
                </div>
                <div className="hidden pl-4 sm:ml-6 lg:flex sm:space-x-4">
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
                  <a
                    href="/beta"
                    className={`
                      inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium
                      text-gray-500 hover:text-gray-700 hover:border-gray-500 p-5
                      dark:text-dark-100 dark:hover:border-dark-100 transition-colors
                    `}
                  >
                    Beta
                  </a>
                  <a
                    href="/pricing"
                    className={`
                      inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium
                      text-gray-500 hover:text-gray-700 hover:border-gray-500 p-5
                      dark:text-dark-100 dark:hover:border-dark-100 transition-colors
                    `}
                  >
                    Pricing
                  </a>
                </div>
              </div>
              <div className="items-center hidden lg:flex sm:space-x-4">
                <a href="https://app.supabase.io/api/login">
                  <Button>Start your project</Button>
                </a>
                <a
                  href="https://app.supabase.io/api/login"
                  className={`
                     items-center px-1 border-b-2 border-transparent text-sm font-medium
                    text-gray-500 hover:text-gray-700 hidden lg:block dark:text-dark-100 dark:hover:text-white
                  `}
                >
                  Sign in
                </a>
              </div>
            </div>
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
            <div className="fixed z-50 w-screen h-screen p-4 overflow-y-scroll transform bg-white md:p-8 -inset-y-0 dark:bg-dark-700">
              <div className="absolute items-center justify-between right-4 top-4">
                <div className="-mr-2">
                  <button
                    onClick={() => setOpen(false)}
                    type="button"
                    className="inline-flex items-center justify-center p-2 text-gray-400 bg-white rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-dark-800"
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
                  <a
                    href="https://app.supabase.io/api/login"
                    className="block pl-3 pr-4 text-base font-medium text-gray-600 dark:text-white"
                  >
                    Sign in
                  </a>
                </div>
                <div className="pt-2 pb-4 space-y-1">
                  <a
                    href="/docs"
                    className="block py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-gray-300 dark:text-white"
                  >
                    Product
                  </a>
                  <a
                    href="/docs"
                    className="block py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-gray-300 dark:text-white"
                  >
                    Developers
                  </a>
                  <a
                    href="/docs"
                    className="block py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-gray-300 dark:text-white"
                  >
                    Company
                  </a>
                  <a
                    href="/pricing"
                    className="block py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-gray-300 dark:text-white"
                  >
                    Pricing
                  </a>
                </div>
                <div className="p-3">
                  <p className="mb-6 text-sm text-gray-400">Products available:</p>
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
    </React.Fragment>
  )
}

export default Nav
