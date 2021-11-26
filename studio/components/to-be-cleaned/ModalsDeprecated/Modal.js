import { Transition } from '@headlessui/react'
import { clickOutsideListener, useKeyboardShortcuts } from 'hooks'

/**
 * Base modal with trigger button and close button
 *
 * @param {Boolean}                     open              // The parent should hold the open state
 * @param {Function}                    handleCloseEvent  // Delegate the close event to the parent
 * @param {JSX.Element|JSX.Element[]}   children
 */

export default function Modal({ children, open, handleCloseEvent }) {
  const ref = clickOutsideListener(handleCloseEvent)

  useKeyboardShortcuts({
    Escape: handleCloseEvent,
  })

  return (
    <div className="relative">
      <Transition
        show={open}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button type="button" aria-label="Close">
                <svg
                  className="h-6 w-6 text-gray-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            <div
              ref={ref}
              className="flex justify-center items-center w-full h-screen"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
              style={{
                maxHeight: '100vh',
                overflow: 'auto',
              }}
            >
              <div className="text-left rounded m-auto shadow-xl transform transition-all bg-gray-700 w-[28rem]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  )
}
