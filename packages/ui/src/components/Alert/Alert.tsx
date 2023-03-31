import React, { useState } from 'react'
import { IconAlertTriangle } from '../Icon/icons/IconAlertTriangle'

import { IconInfo } from '../Icon/icons/IconInfo'
import { IconX } from '../Icon/icons/IconX'

// @ts-ignore
// import AlertStyles from './Alert.module.css'
import styleHandler from '../../lib/theme/styleHandler'
import { IconAlertOctagon } from '../Icon/icons/IconAlertOctagon'
import { IconCheckCircle } from '../Icon/icons/IconCheckCircle'

interface Props {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  className?: string
  title: string | React.ReactNode
  withIcon?: boolean
  closable?: boolean
  children?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
}

const icons: Record<'success' | 'danger' | 'warning' | 'info' | 'neutral', React.ReactElement> = {
  danger: <IconAlertOctagon strokeWidth={1.5} size={18} />,
  success: <IconCheckCircle strokeWidth={1.5} size={18} />,
  warning: <IconAlertTriangle strokeWidth={1.5} size={18} />,
  info: <IconInfo strokeWidth={1.5} size={18} />,
  neutral: <></>,
}

function Alert({
  variant = 'neutral',
  className,
  title,
  withIcon,
  closable,
  children,
  icon,
  actions,
}: Props) {
  let __styles = styleHandler('alert')

  const [visible, setVisible] = useState(true)

  let containerClasses = [__styles.base]
  containerClasses.push(__styles.variant[variant].base)

  if (className) containerClasses.push(className)

  let descriptionClasses = [__styles.description, __styles.variant[variant].description]
  let closeButtonClasses = [__styles.close]

  return (
    <>
      {visible && (
        <div className={containerClasses.join(' ')}>
          {withIcon ? (
            <div className={__styles.variant[variant].icon}>{withIcon && icons[variant]}</div>
          ) : null}
          {icon && icon}
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h3 className={[__styles.variant[variant].header, __styles.header].join(' ')}>
                {title}
              </h3>
              <div className={descriptionClasses.join(' ')}>{children}</div>
            </div>
            {actions}
          </div>
          {closable && (
            <button
              aria-label="Close alert"
              onClick={() => setVisible(false)}
              className={closeButtonClasses.join(' ')}
            >
              <IconX strokeWidth={2} size={16} />
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default Alert
