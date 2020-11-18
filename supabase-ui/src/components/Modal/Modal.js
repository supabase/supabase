import React from 'react'
import PropTypes from 'prop-types'
import './Modal.css'

import Icon from '../Icon/Icon'

import { action } from '@storybook/addon-actions'

import { Button, Transition } from './../../index'

// import addons, { mockChannel } from '@storybook/addons';

// addons.setChannel(mockChannel());

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
  onCancel,
  onConfirm,
  ...props
}) => {

  
  let variantBgColor = {
    alert: 'red',
    warning: 'yellow',
    success: 'green',
  }
  
  let icon = {
    alert: <Icon size={24} strokeWidth={2} type="AlertCircle" color={variantBgColor[variant]} />,
    warning: (
      <Icon size={24} strokeWidth={2} type="AlertCircle" color={variantBgColor[variant]} />
    ),
    success: <Icon size={24} strokeWidth={2} type="Check" color={variantBgColor[variant]} />,
  }

  let bgColor = [`bg-${variantBgColor[variant]}-100`]

  const iconMarkup = showIcon && (
    <div className={"mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-opacity-75 " + bgColor.join(" ")}>
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
        className={"fixed z-10 inset-0 overflow-y-auto " + className}
        onClick={() => onCancel()}
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
              <div className="bg-gray-600 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  {iconMarkup}

                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-white"
                      id="modal-headline"
                    >
                      {title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm leading-5 text-gray-300">
                        {description}
                      </p>
                    </div>
                    {children}
                  </div>
                </div>
              </div>
              <div className="bg-gray-500 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <span className="flex w-full sm:ml-3 sm:w-auto">
                  <Button 
                    onClick={() => onConfirm()}
                  >
                    {onConfirmText}
                  </Button>
                </span>
                <span className="mt-3 flex w-full sm:mt-0 sm:w-auto">
                  <Button
                    variant='white'
                    onClick={() => onCancel()}
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
