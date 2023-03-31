import React from 'react'
import PropTypes from 'prop-types'
import './Textarea.css'

const Textarea = ({
  className = '',
  isError = false,
  rows = 3,
  children,
  borderless = false,
  ...props
}) => {
  const classes = []

  if (isError) {
    classes.push('form-textarea--error')
  }

  if (borderless) {
    classes.push('form-textarea--borderless')
  }

  return (
    <textarea
      className={`form-textarea border-solid ${classes.join(' ')} ${className}`}
      rows={rows}
      {...props}
    />
  )
}

Textarea.propTypes = {
  isError: PropTypes.bool,
  className: PropTypes.string,
  borderless: PropTypes.bool,
}

export default Textarea
