import React from 'react'
import PropTypes from 'prop-types'
import './Checkbox.css'

const Checkbox = ({
  className = '',
  label = '',
  containerClassName = '',
  children,
  ...props
}) => {

  return (
    <label className={`inline-flex items-center ${containerClassName}`}>
      <input type="checkbox" className={`form-checkbox border-solid h-4 w-4 ${className}`} {...props} />
      <span className="ml-2">{label}</span>
    </label>
  )
}

Checkbox.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
}

export default Checkbox
