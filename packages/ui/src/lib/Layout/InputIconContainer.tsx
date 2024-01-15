import React from 'react'
import styleHandler from '../theme/styleHandler'
import { cn } from '../utils'

export default function InputIconContainer({ icon, className }: any) {
  const __styles = styleHandler('inputIconContainer')
  return <div className={cn(__styles.base, className)}>{icon}</div>
}
