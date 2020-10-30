import React from 'react'
import PropTypes from 'prop-types'
import './Button.css'

export const SIZES = ['small', 'medium', 'large']
export const VARIANTS = ['solid', 'outline', 'ghost']

const Button = ({
  className = '',
  children,
  block,
  size = 'medium',
  variant = 'solid',
  ...props
}) => {
  let classes = []

  if (block) {
    classes.push('w-full')
  }

  if (size) {
    let sizeClasses = {
      small: 'btn--small',
      medium: 'btn--medium',
      large: 'btn--large',
    }
    classes.push(sizeClasses[size])
  }

  if (variant) {
    let variantClasses = {
      solid: 'btn--solid',
      outline: 'btn--outline',
      ghost: 'btn--ghost',
    }

    classes.push(variantClasses[variant])
  }

  return (
    <button className={`btn ${classes.join(' ')} ${className}`} {...props}>
      {children}
    </button>
  )
}

Button.propTypes = {
  size: PropTypes.oneOf(SIZES),
  variant: PropTypes.oneOf(VARIANTS),
  block: PropTypes.bool,
  className: PropTypes.string,
}

export default Button
