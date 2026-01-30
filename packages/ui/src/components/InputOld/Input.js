import React from 'react'
import PropTypes from 'prop-types'
import './Input.css'

export const SIZES = ['small', 'medium']

/**
 * A legacy input component.
 * @param {object} props - The component props.
 * @param {string} [props.className=''] - Additional CSS class names.
 * @param {string} [props.type='text'] - The type of the input.
 * @param {'small' | 'medium'} [props.size='medium'] - The size of the input.
 * @param {boolean} [props.isError=false] - If `true`, the input will have an error style.
 * @returns {React.ReactElement} The input component.
 * @deprecated Use `import { Input_shadcn_ } from "ui"` with `type="number"` instead or ./ui-patterns/data-inputs/input with `type="number"`
 */
const Input = ({
  className = '',
  type = 'text',
  size = 'medium',
  isError = false,
  children,
  ...props
}) => {
  const classes = []
  if (size) {
    const sizeClasses = {
      small: 'form-input--small',
      medium: 'form-input--medium',
    }
    classes.push(sizeClasses[size])
  }

  if (isError) {
    classes.push('form-input--error')
  }

  return (
    <input
      type={type}
      className={`form-input border-solid ${classes.join(' ')} ${className}`}
      {...props}
    />
  )
}

Input.propTypes = {
  size: PropTypes.oneOf(SIZES),
  isError: PropTypes.bool,
  className: PropTypes.string,
}

export default Input
