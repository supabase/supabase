import React from 'react'
import './Button.css'

const Button = ({ className, children, ...props }) => (
  <button className="btn w-full">{children}</button>
)

export default Button
