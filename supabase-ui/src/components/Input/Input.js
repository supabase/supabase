import React from 'react'
import PropTypes from 'prop-types'
import './Input.css'

export const SIZES = ['small', 'medium']

const Input = ({
  className,
  children,
  size = 'medium',
  isError = false,
  ...props
}) => {
  const classes = []
  if (size) {
    const sizeClasses = {
      small: 'form--small',
      medium: 'form--medium',
    }
    classes.push(sizeClasses[size])
  }

  if (isError) {
    classes.push('form--error')
  }

  return (
    <input
      className={`form-input border-solid ${classes.join(' ')}`}
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
