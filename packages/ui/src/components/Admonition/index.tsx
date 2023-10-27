import { PropsWithChildren } from 'react'
import { IconAlertTriangle, IconHelpCircle, IconInfo } from 'ui'

export interface AdmonitionProps {
  type: 'note' | 'tip' | 'info' | 'caution' | 'danger'
  label?: string
}

export const Admonition = ({
  type = 'note',
  label,
  children,
}: PropsWithChildren<AdmonitionProps>) => {
  return (
    <div
      className={[
        'shadow p-4 rounded border-l-[5px] space-y-2 my-4',
        `${
          type === 'note'
            ? 'bg-surface-200 border-stronger'
            : type === 'info'
            ? 'bg-surface-300 border-stronger'
            : type === 'tip'
            ? 'bg-brand-300 border-brand-300'
            : type === 'caution'
            ? 'bg-yellow-400 border-yellow-800'
            : type === 'danger'
            ? 'bg-red-500 border-red-800'
            : 'bg-surface-300 border-stronger'
        }`,
      ].join(' ')}
    >
      <div className="flex items-center space-x-2">
        {type === 'note' ? (
          <IconInfo className="text-foreground" size={18} strokeWidth={1.5} />
        ) : type === 'info' ? (
          <IconInfo className="text-foreground" size={18} strokeWidth={1.5} />
        ) : type === 'tip' ? (
          <IconHelpCircle className="text-foreground" size={18} strokeWidth={1.5} />
        ) : type === 'caution' ? (
          <IconAlertTriangle className="text-foreground" size={18} strokeWidth={1.5} />
        ) : type === 'danger' ? (
          <IconAlertTriangle className="text-foreground" size={18} strokeWidth={1.5} />
        ) : (
          <IconInfo className="text-foreground" size={18} strokeWidth={1.5} />
        )}
        <p className="text-sm text-foreground uppercase my-0 font-bold">{label || type}</p>
      </div>
      <div className="admonition-content text-foreground text-base space-y-1">{children}</div>
    </div>
  )
}
