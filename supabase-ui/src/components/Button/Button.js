import React from 'react'
import PropTypes from 'prop-types'
import './Button.css'

export const SIZES = ['tiny', 'small', 'medium', 'large', 'xlarge']
export const VARIANTS = ['solid', 'secondary', 'white', 'outline', 'ghost']

const Button = ({
  className = '',
  children,
  block,
  size = 'medium',
  variant = 'solid',
  shadow = true,
  ...props
}) => {
  let classes = []

  if (block) {
    classes.push('w-full')
  }

  if (size) {
    let sizeClasses = {
      tiny: 'btn--tiny',
      small: 'btn--small',
      medium: 'btn--medium',
      large: 'btn--large',
      xlarge: 'btn--xlarge',
    }
    classes.push(sizeClasses[size])
  }

  if (variant) {
    let variantClasses = {
      solid: 'btn--solid',
      secondary: 'btn--secondary',
      white: 'btn--white',
      outline: 'btn--outline',
      ghost: 'btn--ghost',
    }

    classes.push(variantClasses[variant])
  }

  return (
    <React.Fragment>
      <span className={"inline-flex rounded-md " + (variant !== 'ghost' && shadow ? 'shadow-sm' : '')}>
        <button className={`btn ${classes.join(' ')} ${className}`} {...props}>
          {children}
        </button>
      </span>
    </React.Fragment>
  )
}

Button.propTypes = {
  size: PropTypes.oneOf(SIZES),
  variant: PropTypes.oneOf(VARIANTS),
  block: PropTypes.bool,
  shadow: PropTypes.bool,
  className: PropTypes.string,
}

export default Button
