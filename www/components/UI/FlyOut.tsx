import React, { useState, useEffect, useImperativeHandle } from 'react'
import Transition from 'lib/Transition'

type Props = {
  title: string
  children?: React.ReactNode,
  ref? : any
}

const FlyOut = (props :Props) => {
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

  return (
    <>
      <a
        href="#"
        className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-100 dark:hover:border-dark-100"
        onClick={() => handleToggle()}
      >
        <span>{props.title}</span>
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
            className="absolute inset-x-0 transform shadow-lg border-t border-gray-100 dark:border-dark-500"
            style={{
              zIndex: 999,
              position: 'absolute',
              width: '100vw',
              margin: '0 auto',
              marginTop: '63px',
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
              {props.children}
            </div>
          </div>
          <div
            className="fixed inset-0 transition-opacity bg-red"
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
