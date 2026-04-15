import React, { useEffect } from 'react'
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

  useEffect(() => {
    function handleScroll() {
      if (window.pageYOffset > 96) handleCancel()
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          <div className="absolute inset-x-0 transform shadow-lg ">
            <div
              className="border-default absolute inset-0 flex border-b sm:flex-col lg:flex-row"
              aria-hidden="true"
            >
              <div className="bg-background border-muted border-r sm:h-1/2 sm:w-full lg:h-full lg:w-1/2" />
              <div
                className={`${
                  singleBgColor ? 'bg-background' : 'bg-surface-100'
                } sm:h-1/2 sm:w-full lg:h-full lg:w-1/2`}
              />
            </div>
            <div className="container relative mx-auto px-6 py-2 lg:grid-cols-2 lg:px-10 xl:px-14">
              {children}
            </div>
            <div
              className="absolute z-50 h-screen w-full opacity-0"
              style={{
                pointerEvents: 'visiblePainted',
              }}
              onClick={() => props.handleCancel()}
            ></div>
          </div>
        </>
      </Transition>
    </>
  )
}

export default FlyOut
