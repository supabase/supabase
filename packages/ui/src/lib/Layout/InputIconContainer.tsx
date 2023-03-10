import React from 'react'
import useStyles from '../theme/use-styles'

export default function InputIconContainer({ icon }: any) {
  const __styles = useStyles('inputIconContainer')
  return <div className={__styles.base}>{icon}</div>
}
