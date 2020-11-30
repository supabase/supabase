import React, { useState } from 'react'
import Link from 'next/link'

import Badge from 'components/badge'
import FlyOut from 'components/Nav/FlyOut'
import Transition from 'lib/Transition'
import Solutions from 'data/Solutions.json'

const Nav = () => {
  const [open, setOpen] = useState(false)

  React.useEffect(() => {
    if(open) {
      console.log('open if')
      // Prevent scrolling on mount
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [open]);
  
  const iconSections = Object.values(Solutions).map((solution: any, idx: number) => {
    const { name, description, icon, label, url } = solution

    const content = (
      <div className="mb-3 flex md:h-full lg:flex-col">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-gray-900 text-white sm:h-12 sm:w-12">
            {/* <!-- Heroicon name: chart-bar --> */}
            <svg
              className="h-6 w-6"
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
            <p className="text-base font-medium text-gray-900">
              {name} {label && <Badge>{label}</Badge>}
            </p>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
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
        href="#"
        className="-m-3 p-3 flex flex-col justify-between rounded-lg hover:bg-gray-50 transition ease-in-out duration-150"
      >
        {content}
      </a>
    ) : (
      <div
        key={`solution_${idx}`}
        className="-m-3 p-3 flex flex-col justify-between rounded-lg transition ease-in-out duration-150">
        {content}
      </div>
    )
  })

  type HamburgerButtonProps = {
    toggleFlyOut: Function,
  }

  const HamburgerButton = (props: HamburgerButtonProps) => (
    <div
      className="absolute inset-y-0 left-0 flex items-center sm:hidden"
      onClick={() => props.toggleFlyOut()}
    >
      <button
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>

        <svg
          className="block h-6 w-6"
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
          className="hidden h-6 w-6"
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

  return (
    <nav className="bg-white dark:bg-dark-300 z-50 shadow-lg sticky">
      <div className="container mx-auto relative flex justify-between h-16">
        
        <HamburgerButton toggleFlyOut={() => setOpen(true)} />

        <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
          <div className="flex-shrink-0 flex items-center">
            {/* Mobile - remove if not needed */}
            <img
              className="block lg:hidden h-6 w-auto"
              src="images/logo-light.png"
              alt="Workflow"
            />
            {/* Desktop */}
            <img
              className="hidden lg:block h-6 w-auto"
              src="images/logo-dark.png"
              alt="Workflow"
            />
          </div>
          <div className="pl-4 hidden sm:ml-6 sm:flex sm:space-x-8">
            <FlyOut />
            <a
              href="#"
              className={`
                inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium
                text-gray-500 hover:text-gray-700 hover:border-gray-500
                dark:hover:text-gray-300 dark:hover:border-gray-300
              `}
            >
              Developers
            </a>
            <a
              href="#"
              className={`
                inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium
                text-gray-500 hover:text-gray-700 hover:border-gray-500
                dark:hover:text-gray-300 dark:hover:border-gray-300
              `}
            >
              Company
            </a>
            <a
              href="#"
              className={`
                inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium
                text-gray-500 hover:text-gray-700 hover:border-gray-500
                dark:hover:text-gray-300 dark:hover:border-gray-300
              `}
            >
              Pricing
            </a>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"></div>
      </div>

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
        
          <div className="p-4 md:p-8 h-full h-screen fixed bg-white transform lg:hidden overflow-y-scroll -inset-y-0" style={{zIndex: 999}}>
            {/* <div className="rounded-lg shadow-md bg-white ring-1 ring-black ring-opacity-5 overflow-hidden"> */}
              <div className="absolute right-4 top-4 items-center justify-between">
                <div className="-mr-2">
                  <button
                    onClick={() => setOpen(false)}
                    type="button"
                    className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
                  >
                    <span className="sr-only">Close menu</span>

                    <svg
                      className="h-6 w-6"
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
                  href="#"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                >
                  Product
                </a>
                <a
                  href="#"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                >
                  Developers
                </a>
                <a
                  href="#"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                >
                  Company
                </a>
                <a
                  href="#"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
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
  )
}

export default Nav