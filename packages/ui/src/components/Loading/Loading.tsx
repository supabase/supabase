import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'
import { IconLoader } from './../../../index'

interface Props {
  children: React.ReactNode
  active: boolean
  className?: string
  contentClassName?: string
}
export default function Loading({ children, active, className, contentClassName }: Props) {
  const __styles = styleHandler('loading')

  let classNames = [__styles.base, className]

  let contentClasses = [__styles.content.base, contentClassName]

  if (active) {
    contentClasses.push(__styles.content.active)
  }

  let spinnerClasses = [__styles.spinner]

  return (
    <div className={classNames.join(' ')}>
      <div className={contentClasses.join(' ')}>{children}</div>
      {active && <IconLoader size="xlarge" className={spinnerClasses} />}
    </div>
  )
}
