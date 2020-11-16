import React from 'react'
import PropTypes from 'prop-types'

import Icon from '../Icon/Icon'

import { action } from '@storybook/addon-actions'

import Transition from './../../lib/Transition'
import { Button } from '../Button'

// import './Button.css'

export const SIZES = ['small', 'medium', 'large']
export const VARIANTS = ['alert', 'warning', 'success']

const SideOver = ({
  className = '',
  children,
  title = 'This is the title',
  description = 'This is the description',
  variant = 'success',
  showIcon = true,
  visible = true,
  onConfirmText = 'Confirm',
  onCancelText = 'Cancel',
  ...props
}) => {
  let icon = {
    alert: <Icon size={24} strokeWidth={2} type="AlertCircle" color="red" />,
    warning: (
      <Icon size={24} strokeWidth={2} type="AlertCircle" color="orange" />
    ),
    success: <Icon size={24} strokeWidth={2} type="Check" color="green" />,
  }

  let variantBgColor = {
    alert: 'red',
    warning: 'orange',
    success: 'green',
  }

  let bgColor = [`bg-${variantBgColor[variant]}-100`]
  let color = [`${variantBgColor[variant]}-100`]

  const iconMarkup = showIcon && (
    <div
      className={
        'mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ' +
        bgColor.join(' ')
      }
    >
      {icon[variant]}
    </div>
  )

  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <div className="fixed inset-0 overflow-hidden" onClick={action('onCancel')}>
      <div className="absolute inset-0 overflow-hidden">
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <Transition
            show={visible}
            enter="transform transition ease-in-out duration-500 sm:duration-700"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-500 sm:duration-700"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="w-screen max-w-md">
              <div className="h-full divide-y divide-gray-200 flex flex-col bg-gray-600 shadow-xl" onClick={stopPropagation}>
                <div className="min-h-0 flex-1 flex flex-col py-6 space-y-6 overflow-y-scroll">
                  <header className="px-4 sm:px-6">
                    <div className="flex items-start justify-between space-x-3">
                      <h2 className="text-lg leading-7 font-medium text-white">
                        Panel title
                      </h2>
                      <div className="h-7 flex items-center">
                        <button
                          aria-label="Close panel"
                          className="text-gray-400 hover:text-gray-500 transition ease-in-out duration-150 bg-transparent border-none"
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
                  </header>
                  <div className="relative flex-1 px-4 sm:px-6">
                    {/* <!-- Replace with your content --> */}
                    <div className="h-full border-2 border-dashed border-gray-200"></div>
                    {/* <!-- /End replace --> */}
                  </div>
                </div>
                <div className="flex-shrink-0 px-4 py-4 space-x-4 flex justify-end">
                  <span className="inline-flex rounded-md shadow-sm">
                    <Button
                    variant='secondary'
                    onClick={action('onCancel')}>
                      Cancel
                    </Button>
                  </span>
                  <span className="inline-flex rounded-md shadow-sm">
                    <Button 
                      type="submit"
                      onClick={action('onSubmit')}
                    >
                      Submit
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          </Transition>
        </section>
      </div>
    </div>
  )
}

SideOver.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  variant: PropTypes.oneOf(VARIANTS),
  showIcon: PropTypes.bool,
  className: PropTypes.string,
  onConfirmText: PropTypes.string,
  onCancelText: PropTypes.string,
}

export default SideOver
