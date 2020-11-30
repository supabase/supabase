import { useState, useEffect } from 'react'
import Badge from 'components/badge'
import Transition from 'lib/Transition'
import Solutions from 'data/Solutions.json'

const FlyOut = () => {
  const [show, setShow] = useState(false)

  function handleToggle() {
    setShow(!show)
  }

  useEffect(() => {
    // window is accessible here.
    window.addEventListener('scroll', function (e) {
      // close Fly Out window if user scrolls past 96px from top
      if (window.pageYOffset > 96) {
        setShow(false)
      }
    })
  }, [])

  const iconSections = Object.values(Solutions).map((solution) => {
    const { name, description, icon, label, url } = solution

    const content = (
      <div className="flex md:h-full lg:flex-col">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-gray-900 dark:bg-white text-white sm:h-12 sm:w-12">
            <svg
              className="h-6 w-6 stroke-white dark:stroke-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
        </div>
        <div className="ml-4 md:flex-1 md:flex md:flex-col md:justify-between lg:ml-0 lg:mt-4">
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {name} {label && <Badge>{label}</Badge>}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-100">
              {description}
            </p>
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
        key={name}
        href="#"
        className="-m-3 p-3 flex flex-col justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-dark-300 transition ease-in-out duration-150"
      >
        {content}
      </a>
    ) : (
      <div key={name} className="-m-3 p-3 flex flex-col justify-between rounded-lg transition ease-in-out duration-150">
        {content}
      </div>
    )
  })

  return (
    <>
      <a
        href="#"
        className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-300"
        onClick={() => handleToggle()}
      >
        <span>Product</span>
        <svg
          className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500 transition ease-in-out duration-150"
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
      </a>
      <Transition
        appear={true}
        show={show}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <>
          <div
            className="absolute inset-x-0 transform shadow-lg border-t-2 border-gray-50 dark:border-dark-200"
            style={{
              zIndex: 999,
              position: 'absolute',
              width: '100vw',
              margin: '0 auto',
              marginTop: '64px',
              left: '-50vw',
              right: '-50vw',
            }}
          >
            <div className="absolute inset-0 flex" aria-hidden="true">
              <div className="bg-white dark:bg-dark-400 w-1/2"></div>
              <div className="bg-gray-50 dark:bg-dark-300 w-1/2"></div>
            </div>
            <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
              <nav
                className="grid gap-y-10 px-4 py-8 sm:grid-cols-2 sm:gap-x-8 sm:py-12 sm:px-6 lg:px-8 xl:pr-12"
                aria-labelledby="solutionsHeading"
              >
                {iconSections}
              </nav>
              <div className="px-4 py-8 sm:py-12 sm:px-6 lg:px-8 xl:pl-12">
                <div>
                  <h3 className="text-sm font-medium tracking-wide text-gray-500 dark:text-dark-100 uppercase">
                    Latest news
                  </h3>
                  <ul className="mt-6 space-y-6">
                    <li className="flow-root">
                      <a
                        href="#"
                        className="-m-3 p-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition ease-in-out duration-150"
                      >
                        <div className="hidden sm:block flex-shrink-0">
                          <img
                            className="w-32 h-20 object-cover rounded-md"
                            src="https://images.unsplash.com/photo-1558478551-1a378f63328e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2849&q=80"
                            alt=""
                          />
                        </div>
                        <div className="min-w-0 flex-1 sm:ml-8">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                            Supabase launch news
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-dark-100">
                            Eget ullamcorper ac ut vulputate fames nec mattis pellentesque
                            elementum. Viverra tempor id mus.
                          </p>
                        </div>
                      </a>
                    </li>
                    <li className="flow-root">
                      <a
                        href="#"
                        className="-m-3 p-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition ease-in-out duration-150"
                      >
                        <div className="hidden sm:block flex-shrink-0">
                          <img
                            className="w-32 h-20 object-cover rounded-md"
                            src="https://images.unsplash.com/1/apple-gear-looking-pretty.jpg?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
                            alt=""
                          />
                        </div>
                        <div className="min-w-0 flex-1 sm:ml-8">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                            New project example released
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-dark-100">
                            Eget ullamcorper ac ut vulputate fames nec mattis pellentesque
                            elementum. Viverra tempor id mus.
                          </p>
                        </div>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 text-sm font-medium">
                  <a
                    href="#"
                    className="text-gray-600 hover:text-gray-500 dark:text-brand-600 dark:hover:text-brand-700 transition ease-in-out duration-150"
                  >
                    View all posts <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              zIndex: 100,
              marginLeft: 0,
              pointerEvents: 'visiblePainted',
            }}
            onClick={() => handleToggle()}
          >
            <div className="absolute inset-0 opacity-0"></div>
          </div>
        </>
      </Transition>
    </>
  )
}

export default FlyOut
