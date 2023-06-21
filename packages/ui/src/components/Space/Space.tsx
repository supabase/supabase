import React from 'react'
// import SpaceStyles from './Space.module.css'

interface Props {
  direction?: 'vertical' | 'horizontal'
  size?: number
  className?: string
  block?: boolean
  style?: React.CSSProperties
  minus?: boolean
  children: React.ReactNode
}

function Space({ direction, size = 2, className, block, style, minus, children }: Props) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export default Space
