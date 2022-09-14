import React from 'react'
import styleHandler from '../theme/styleHandler'

export default function InputIconContainer({ icon }: any) {
  const __styles = styleHandler('inputIconContainer')
  return <div className={__styles.base}>{icon}</div>
}
