import React from 'react'
import PropTypes from 'prop-types'
import './Input.css'

export const SIZES = ['small', 'medium']

const Input = ({
  className = '',
  type='text',
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
