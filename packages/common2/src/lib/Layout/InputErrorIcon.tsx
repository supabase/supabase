import React from 'react'
import styleHandler from '../theme/styleHandler'
// @ts-ignore
import { IconAlertCircle } from './../../../index'

interface Props {
  style?: React.CSSProperties
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
}

export default function InputErrorIcon({ style, size }: Props) {
  const __styles = styleHandler('inputErrorIcon')

  return (
    <div className={__styles.base} style={style}>
      <IconAlertCircle
        size={size}
        strokeWidth={2}
        // stroke={'#f56565'}
        className=""
      />
    </div>
  )
}
