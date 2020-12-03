import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import Transition from 'lib/Transition'

type Props = {
  title?: string
  children?: React.ReactNode
  className?: string
  open?: boolean
  handleCancel?: any
  singleBgColor?: boolean
}

const FlyOut = (props: Props) => {
  const { title = '', children, className = '', singleBgColor = false, handleCancel } = props
  const [show, setShow] = useState(false)

  useEffect(() => {
    function handleScroll() {
      if (window.pageYOffset > 96) handleCancel()
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  })

  // function handleToggle() {
  //   setShow(!show)
  //   props.handleClick()
  // }

  // useImperativeHandle(
  //   ref,
  //   () => ({
  //       close() {
  //         setShow(false)
  //       }
  //   }),
  // )

  // useEffect(() => {
  //   // window is accessible here.
  //   window.addEventListener('scroll', function (e) {
  //     // close Fly Out window if user scrolls past 96px from top
  //     if (window.pageYOffset > 96) {
  //       setShow(false)
  //     }
  //   })
  // }, [])

  return (
    <>
      <Transition
        appear={true}
        show={props.open}
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
              top: 0,
            }}
          >
            <div className="absolute inset-0 flex sm:flex-col lg:flex-row" aria-hidden="true">
              <div className="bg-white dark:bg-dark-600 sm:w-full sm:h-1/2 lg:w-1/2 lg:h-full" />
              <div
                className={`${
                  singleBgColor ? 'bg-white dark:bg-dark-600' : 'bg-gray-50 dark:bg-dark-500'
                } sm:w-full sm:h-1/2 lg:w-1/2 lg:h-full`}
              />
              {/* <div className="bg-gray-50 dark:bg-dark-300 md:hidden lg:block lg:w-1/2"></div> */}
            </div>
            <div
              className={`relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 ${className}`}
            >
              {children}
            </div>
          </div>
          <div
            className="fixed inset-0 t-63 transition-opacity bg-red"
            style={{
              zIndex: 10,
              top: '63px',
              marginLeft: 0,
              pointerEvents: 'visiblePainted',
            }}
            onClick={() => props.handleCancel()}
          >
            <div className="absolute inset-0 opacity-0"></div>
          </div>
        </>
      </Transition>
    </>
  )
}

export default FlyOut
