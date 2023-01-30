import React from 'react'
// @ts-ignore
// import DividerStyles from './Divider.module.css'

interface Props {
  children?: React.ReactNode
  className?: string
  light?: boolean
  orientation?: 'left' | 'right' | 'center'
  style?: React.CSSProperties
  type?: 'vertical' | 'horizontal'
}

export default function Divider({
  children,
  className,
  light = false,
  orientation = 'center',
  style,
  type = 'horizontal',
}: Props) {
  // let classes = [
  //   type === 'horizontal'
  //     ? DividerStyles['sbui-divider']
  //     : DividerStyles['sbui-divider-vertical'],
  // ]
  // if (light) classes.push(DividerStyles['sbui-divider--light'])

  // if (children) {
  //   classes.push(DividerStyles[`sbui-divider--${orientation}`])
  // } else if (!children && type === 'horizontal') {
  //   classes.push(DividerStyles[`sbui-divider--no-text`])
  // }

  // if (className) classes.push(className)

  return (
    <div
      // className={classes.join(' ')}
      role="separator"
      style={style}
    >
      {children && (
        <span
        // className={DividerStyles['sbui-divider__content']}
        >
          {children}
        </span>
      )}
    </div>
  )
}
