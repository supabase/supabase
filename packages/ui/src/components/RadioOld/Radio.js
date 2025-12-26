import PropTypes from 'prop-types'
import React from 'react'

import './Radio.css'

/**
 * @deprecated Use `import { RadioGroup_Shadcn_, RadioGroupItem_Shadcn_ } from "ui"` instead
 */
const Radio = ({ className = '', label = '', containerClassName = '', children, ...props }) => {
  return (
    <label className={`inline-flex items-center ${containerClassName}`}>
      <input type="radio" className={`form-radio border-solid h-4 w-4 ${className}`} {...props} />
      <span className="ml-2">{label}</span>
    </label>
  )
}

Radio.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
}

export default Radio
