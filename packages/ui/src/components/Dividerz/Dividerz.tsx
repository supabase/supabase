import React from 'react'
// @ts-ignore
// import DividerzStyles from './Dividerz.module.css'

interface Props {
  children?: React.ReactNode
  className?: string
  light?: boolean
  orientation?: 'left' | 'right' | 'center'
  style?: React.CSSProperties
  type?: 'vertical' | 'horizontal'
}

export default function Dividerz({
  children,
  className,
  light = false,
  orientation = 'center',
  style,
  type = 'horizontal',
}: Props) {
  // let classes = [
  //   type === 'horizontal'
  //     ? DividerzStyles['sbui-dividerz']
  //     : DividerzStyles['sbui-dividerz-vertical'],
  // ]
  // if (light) classes.push(DividerzStyles['sbui-dividerz--light'])

  // if (children) {
  //   classes.push(DividerzStyles[`sbui-dividerz--${orientation}`])
  // } else if (!children && type === 'horizontal') {
  //   classes.push(DividerzStyles[`sbui-dividerz--no-text`])
  // }

  // if (className) classes.push(className)

  return (
    <div
      // className={classes.join(' ')}
      role="seperator"
      style={style}
    >
      {children && (
        <span
        // className={DividerzStyles['sbui-dividerz__content']}
        >
          {children}
        </span>
      )}
    </div>
  )
}
