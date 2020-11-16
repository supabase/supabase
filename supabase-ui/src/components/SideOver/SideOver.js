import React from 'react'
import PropTypes from 'prop-types'

import { action, actions } from '@storybook/addon-actions'

import Transition from './../../lib/Transition'
import { Button } from '../Button'

const SideOver = ({
  className = '',
  children,
  title = 'This is the title',
  description = 'This is the description',
  visible = true,
  wide = false,
  left = false,
  onConfirmText = 'Confirm',
  onCancelText = 'Cancel',
  customFooter = undefined,
  hideFooter = false,
  ...props
}) => {
  function stopPropagation(e) {
    e.stopPropagation()
  }

  const orientationClasses = left ? 'left-0 pr-10' : 'right-0 pl-10'

  return (
    <React.Fragment>

      {/* Background overlay */}
      <Transition
        show={visible}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
      </Transition>

      {/* SideOver element */}
      <div
        className="fixed inset-0 overflow-hidden"
        onClick={action('onCancel')}
      >
        <div className="absolute inset-0 overflow-hidden">
          <section
            className={
              'absolute inset-y-0 max-w-full flex ' + orientationClasses
            }
          >
            <Transition
              show={visible}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom={left ? '-translate-x-full' : 'translate-x-full'}
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo={left ? '-translate-x-full' : 'translate-x-full'}
            >
              <div className={'w-screen ' + (wide ? 'max-w-2xl' : 'max-w-md')}>
                <div
                  className="h-full flex flex-col bg-gray-600 shadow-xl"
                  onClick={stopPropagation}
                >
                  <div className="min-h-0 flex-1 flex flex-col space-y-6 overflow-y-scroll">
                    <header className="space-y-1 py-6 px-4 bg-gray-500 sm:px-6">
                      <div className="flex items-center justify-between space-x-3">
                        <h2
                          className="text-lg leading-7 font-medium text-white"
                          style={{ margin: 0 }}
                        >
                          {title}
                        </h2>
                        <div className="h-7 flex items-center">
                          <button
                            aria-label="Close panel"
                            className="text-gray-400 hover:text-gray-500 transition ease-in-out duration-150 bg-transparent border-none cursor-pointer"
                            onClick={action('onCancel')}
                          >
                            {/* <!-- Heroicon name: x --> */}
                            <svg
                              className="h-6 w-6"
                              xmlns="http://www.w3.org/2000/svg"
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
                      </div>
                      <div>
                        <p
                          className="text-sm leading-5 text-gray-300"
                          style={{ marginTop: 0 }}
                        >
                          {description}
                        </p>
                      </div>
                    </header>
                    <div className="relative flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                  {!hideFooter && (
                    <div className="bg-gray-500 flex-shrink-0 px-4 py-4 space-x-4 flex justify-end">
                      {customFooter ? (
                        customFooter
                      ) : (
                        <React.Fragment>
                          <span className="inline-flex rounded-md shadow-sm">
                            <Button
                              variant="white"
                              onClick={action('onCancel')}
                            >
                              {onCancelText}
                            </Button>
                          </span>
                          <span className="inline-flex rounded-md shadow-sm">
                            <Button type="submit" onClick={action('onSubmit')}>
                              {onConfirmText}
                            </Button>
                          </span>
                        </React.Fragment>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Transition>
          </section>
        </div>
      </div>
    </React.Fragment>
  )
}

SideOver.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
  wide: PropTypes.bool,
  left: PropTypes.bool,
  onConfirmText: PropTypes.string,
  onCancelText: PropTypes.string,
  customFooter: PropTypes.array,
  hideFooter: PropTypes.bool,
}

export default SideOver
