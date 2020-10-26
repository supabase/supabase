import React from 'react'
import PropTypes from 'prop-types'
import './Textarea.css'

const Textarea = ({
  className = '',
  isError = false,
  rows = 3,
  children,
  ...props
}) => {
  const classes = []

  if (isError) {
    classes.push('form-textarea--error')
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
}

export default Textarea
