import React from 'react'
import PropTypes from 'prop-types'
import './Button.css'
import * as Icons from 'react-feather'

import { Icon, Transition } from '../../index'

export const SIZES = ['tiny', 'small', 'medium', 'large', 'xlarge']
export const VARIANTS = ['solid', 'secondary', 'white', 'outline', 'ghost']

const Button = ({
  className = '',
  children,
  block,
  size = 'medium',
  variant = 'solid',
  shadow = true,
  disabled = false,
  loading = false,
  icon = undefined,
  ...props
}) => {

  // default classes
  let classes = []

  if (block) {
    classes.push('w-full')
  }

  if (size) {
    let sizeClasses = {
      tiny:
        'inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm',
      small:
        'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md',
      medium:
        'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm',
      large:
        'inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm',
      xlarge:
        'inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm',
    }
    classes.push(sizeClasses[size])
  }

  let textColor = {
    solid: 'text-white hover:text-gray-500',
    secondary: 'text-brand-800',
    white: 'text-gray-500',
    outline: 'text-brand-500',
    ghost: 'text-brand-500',
  }

  let variantClasses = {
    solid: 
      'btn--solid bg-brand-500 hover:bg-brand-600',
    secondary:
      'btn--secondary text-brand-800 bg-brand-50 bg-opacity-75 hover:bg-brand-100',
    white:
      'btn--white text-gray-500 bg-white border-gray-100 hover:text-gray-600 hover:bg-white hover:border-gray-200',
    outline:
      'btn--outline bg-transparent border border-brand-500 border-solid text-brand-500 hover:bg-brand-500 hover:text-white',
    ghost:
      'btn--ghost bg-transparent text-brand-500 border-none hover:bg-brand-300 hover:bg-opacity-25',
  }

  classes.push(variantClasses[variant])

  return (
    <React.Fragment>
      <span
        className={
          'inline-flex rounded-md ' +
          (variant !== 'ghost' && shadow ? 'shadow-sm' : '')
        }
      >
        <button
          type="button"
          disabled={loading || disabled && true}
          className={`btn cursor-pointer inline-flex space-x-2 ${classes.join(
            ' '
          )} ${className} ${classes.join(' ')} ${textColor[variant]}`}
          {...props}
        >
          <Transition
            show={icon || loading ? true : false }
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Icon
              size={16}
              className={'stroke-current ' + textColor[variant] + (loading && ' btn--anim--spin' )}
              type={loading ? "Loader" : icon}
            />
          </Transition>
          <span>{children}</span>
        </button>
      </span>
      {/* <br />

      <br />
      <br />
      <br />
      <br />

      <button
        type="button"
        class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Button text
      </button>
      <button
        type="button"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Button text
      </button>
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Button text
      </button>
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Button text
      </button>
      <button
        type="button"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Button text
      </button> */}
    </React.Fragment>
  )
}

Button.propTypes = {
  size: PropTypes.oneOf(SIZES),
  variant: PropTypes.oneOf(VARIANTS),
  block: PropTypes.bool,
  shadow: PropTypes.bool,
  className: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.string
}

export default Button
