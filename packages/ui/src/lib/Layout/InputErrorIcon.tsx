import { AlertCircle } from 'lucide-react'
import React from 'react'

import { ICON_SIZES } from '../../components/Icon/IconBase'
import styleHandler from '../theme/styleHandler'

interface Props {
  style?: React.CSSProperties
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
}

export default function InputErrorIcon({ style, size = 'medium' }: Props) {
  const __styles = styleHandler('inputErrorIcon')

  return (
    <div className={__styles.base} style={style}>
      <AlertCircle size={ICON_SIZES[size]} strokeWidth={2} />
    </div>
  )
}
