import React from 'react'
// @ts-ignore
// import SpaceStyles from './Space.module.css'

function Space({ direction, size = 2, className, block, style, minus, children }: any) {
  // const classes = []
  // classes.push(direction === 'vertical' ? 'sbui-space-col' : 'sbui-space-row')
  // classes.push(
  //   SpaceStyles[
  //     'sbui-' +
  //       (minus ? 'minus-' : '') +
  //       'space-' +
  //       (direction === 'vertical' ? 'y' : 'x') +
  //       '-' +
  //       size
  //   ]
  // )
  // if (block) {
  //   classes.push(SpaceStyles['sbui-space--block'])
  // }
  // if (className) {
  //   classes.push(className)
  // }

  return (
    <div
      // className={classes.join(' ')}
      className={className}
      style={style}
    >
      {children}
    </div>
  )
}

export default Space
