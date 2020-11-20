import React from 'react'
import * as Icons from 'react-feather'
import PropTypes from 'prop-types'

const Icon = ({
  className,
  size = 24,
  type = 'Loader',
  color = ' ',
  strokeWidth = 2,
  ...props
}) => {
  const FeatherIcon = Icons[type]

  return (
    <FeatherIcon
      stroke={color}
      className={`${className}`}
      strokeWidth={strokeWidth}
      size={size}
      {...props}
    />
  )
}

Icon.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  strokeWidth: PropTypes.number,
  type: PropTypes.string,
  className: PropTypes.string,
  color: PropTypes.string,
}

export default Icon
