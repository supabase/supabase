import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
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

  const node = useRef<HTMLDivElement>(null)

  const handleClick = (e: any) => {
    if (node.current?.contains(e.target)) return
    handleCancel()
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

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
            className="absolute inset-x-0 transform shadow-lg border-gray-100 dark:border-dark-500 w-full hidden lg:block bg-white dark:bg-gray-600"
            ref={node}
          >
            <div
              className="border-b dark:border-gray-600 absolute inset-0 flex sm:flex-col lg:flex-row"
              aria-hidden="true"
            >
              <div className="bg-gray-50 dark:bg-gray-600 border-r dark:border-gray-500 sm:w-full sm:h-1/2 lg:w-1/2 lg:h-full" />
              <div
                className={`${
                  singleBgColor ? 'bg-gray-50 dark:bg-dark-600' : 'bg-gray-100 bg-opacity-75 dark:bg-opacity-100 dark:bg-gray-700'
                } sm:w-full sm:h-1/2 lg:w-1/2 lg:h-full`}
              />
            </div>
            <div className="container relative mx-auto lg:grid-cols-2 px-6 lg:px-10 xl:px-14 py-2">
              {children}
            </div>
          </div>
        </>
      </Transition>
    </>
  )
}

export default FlyOut
