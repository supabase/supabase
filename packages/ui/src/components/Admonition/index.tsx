import { PropsWithChildren } from 'react'
import { Alert, AlertVariant } from '../Alert'
export interface AdmonitionProps {
  type: 'note' | 'tip' | 'caution' | 'danger' | 'deprecation'
  label?: string
}

const admonitionToAlertMapping: Record<AdmonitionProps['type'], AlertVariant> = {
  note: 'info',
  tip: 'info',
  caution: 'warning',
  danger: 'danger',
  deprecation: 'warning',
}

export const Admonition = ({
  type = 'note',
  label,
  children,
}: PropsWithChildren<AdmonitionProps>) => {
  return (
    <Alert
      className="not-prose"
      variant={admonitionToAlertMapping[type]}
      title={
        <span className="flex gap-2">
          <span className="uppercase">{`${type}${label ? ':' : ''}`}</span>
          {label}
        </span>
      }
      withIcon
    >
      {children}
    </Alert>
  )
}
