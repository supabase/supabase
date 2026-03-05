import React from 'react'

import Link from './Link'
import Text from './Text'
import Title from './Title'
// @ts-ignore
import TypographyStyles from './Typography.module.css'

function Typography({ children, className, tag = 'div', style }: any) {
  // let classes = [
  //   TypographyStyles['sbui-typography'],
  //   TypographyStyles['sbui-typography-container'],
  // ]
  // if (className) {
  //   classes.push(className)
  // }
  let CustomTag: any = `${tag}`
  return (
    <CustomTag
      style={style}
      // className={classes.join(' ')}
    >
      {children}
    </CustomTag>
  )
}

Typography.Title = Title
Typography.Text = Text
Typography.Link = Link

export default Typography
