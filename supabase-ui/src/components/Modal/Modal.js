import React from 'react'
import PropTypes from 'prop-types'
import './Modal.css'

import Icon from '../Icon/Icon'

import { action } from '@storybook/addon-actions'

import Transition from './../../lib/Transition'
import { Button } from '../Button'

// import './Button.css'

export const SIZES = ['small', 'medium', 'large']
export const VARIANTS = ['alert', 'warning', 'success']

const Modal = ({
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
    <div className={"mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 " + bgColor.join(" ")}>
      {icon[variant]}
    </div>
  )

  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <Transition
      show={visible}
      enter="ease-out duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="font-sans fixed z-10 inset-0 overflow-y-auto"
        onClick={action('onCancel')}
      >
        <div
          className={`flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0`}
        >
          <div className="fixed inset-0 transition-opacity">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          {/* <!-- This element is to trick the browser into centering the modal contents. --> */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
          &#8203;
          <Transition
            show={visible}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
              onClick={stopPropagation}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  {iconMarkup}

                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-headline"
                    >
                      {title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm leading-5 text-gray-500">
                        {description}
                      </p>
                    </div>
                    {children}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <span className="flex w-full sm:ml-3 sm:w-auto">
                  <Button onClick={action('onConfirm')}>
                    {onConfirmText}
                  </Button>
                </span>
                <span className="mt-3 flex w-full sm:mt-0 sm:w-auto">
                  <Button
                    variant='white'
                    onClick={action('onCancel')}
                  >
                    {onCancelText}
                  </Button>
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  )
}

Modal.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  variant: PropTypes.oneOf(VARIANTS),
  showIcon: PropTypes.bool,
  className: PropTypes.string,
  onConfirmText: PropTypes.string,
  onCancelText: PropTypes.string
}

export default Modal
