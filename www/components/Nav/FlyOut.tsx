import { useState, useEffect } from 'react'
import Badge from 'components/Badge'
import Transition from 'lib/Transition'
import Solutions from 'data/Solutions.json'
import CaseStudiesData from 'data/CaseStudies.json'
import { useRouter } from 'next/router'

const FlyOut = () => {
  const { basePath } = useRouter()
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
              {name} {label && <Badge className="ml-3">{label}</Badge>}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">{description}</p>
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
        className="-m-3 p-3 flex flex-col justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition ease-in-out duration-150"
      >
        {content}
      </a>
    ) : (
      <div
        key={name}
        className="-m-3 p-3 flex flex-col justify-between rounded-lg transition ease-in-out duration-150"
      >
        {content}
      </div>
    )
  })

  return (
    <>
      <a
        href="#"
        className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-100 dark:hover:border-dark-100"
        onClick={() => handleToggle()}
      >
        <span>Product</span>
        <svg
          className="ml-2 h-5 w-5 text-gray-300 group-hover:text-gray-300 transition ease-in-out duration-150"
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
            className="absolute inset-x-0 transform shadow-lg border-t border-gray-50 dark:border-dark-500"
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
            <div className="absolute inset-0 flex sm:flex-col lg:flex-row" aria-hidden="true">
              <div className="bg-white dark:bg-dark-600 sm:w-full sm:h-1/2 lg:w-1/2 lg:h-full"></div>
              <div className="bg-gray-50 dark:bg-dark-500 sm:w-full sm:h-1/2 lg:w-1/2 lg:h-full"></div>
              {/* <div className="bg-gray-50 dark:bg-dark-300 md:hidden lg:block lg:w-1/2"></div> */}
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
                  <h3 className="text-sm font-medium tracking-wide text-gray-500 dark:text-dark-300 uppercase">
                    Latest news
                  </h3>
                  <ul className="mt-6 space-y-6">
                    {CaseStudiesData.map((caseStudy: any, idx: number) => (
                      <li className="flow-root" key={`flyout_case_${idx}`}>
                        <a
                          href={caseStudy.url}
                          className="-m-3 p-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition ease-in-out duration-150"
                        >
                          <div className="hidden sm:block flex-shrink-0">
                            <img
                              className="w-32 h-20 object-cover rounded-md"
                              src={`${basePath}/${caseStudy.imgUrl}`}
                              alt="caseStudyThumb"
                            />
                          </div>
                          <div className="min-w-0 flex-1 sm:ml-8">
                            <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                              {caseStudy.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                              {caseStudy.description}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 text-sm font-medium">
                  <a
                    href="/blog"
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
