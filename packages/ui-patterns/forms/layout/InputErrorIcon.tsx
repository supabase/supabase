import { AlertCircle } from 'lucide-react'
import React from 'react'
import styleHandler from '../../../ui/src/lib/theme/styleHandler'

interface Props {
  style?: React.CSSProperties
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
}

export default function InputErrorIcon({ style, size }: Props) {
  const __styles = styleHandler('inputErrorIcon')

  return (
    <div className={__styles.base} style={style}>
      <AlertCircle size={size} strokeWidth={2} />
    </div>
  )
}
