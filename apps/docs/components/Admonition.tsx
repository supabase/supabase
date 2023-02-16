import { FC } from 'react'
import { IconInfo, IconHelpCircle, IconAlertTriangle } from 'ui'

interface Props {
  type: 'note' | 'tip' | 'info' | 'caution' | 'danger'
  label?: string
  children: any
}

const Admonition: FC<Props> = ({ type = 'note', label, children }) => {
  return (
    <div
      className={[
        'shadow p-4 rounded border-l-[5px] space-y-2 my-4',
        `${
          type === 'note'
            ? 'bg-scale-400 border-scale-800'
            : type === 'info'
            ? 'bg-scale-500 border-scale-800'
            : type === 'tip'
            ? 'bg-brand-300 border-brand-800'
            : type === 'caution'
            ? 'bg-yellow-400 border-yellow-800'
            : type === 'danger'
            ? 'bg-red-500 border-red-800'
            : 'bg-scale-500 border-scale-800'
        }`,
      ].join(' ')}
    >
      <div className="flex items-center space-x-2">
        {type === 'note' ? (
          <IconInfo className="text-scale-1200" size={18} strokeWidth={1.5} />
        ) : type === 'info' ? (
          <IconInfo className="text-scale-1200" size={18} strokeWidth={1.5} />
        ) : type === 'tip' ? (
          <IconHelpCircle className="text-scale-1200" size={18} strokeWidth={1.5} />
        ) : type === 'caution' ? (
          <IconAlertTriangle className="text-scale-1200" size={18} strokeWidth={1.5} />
        ) : type === 'danger' ? (
          <IconAlertTriangle className="text-scale-1200" size={18} strokeWidth={1.5} />
        ) : (
          <IconInfo className="text-scale-1200" size={18} strokeWidth={1.5} />
        )}
        <p className="my-0 text-sm font-bold uppercase text-scale-1200">{label || type}</p>
      </div>
      <div className="space-y-1 text-base admonition-content text-scale-1200">{children}</div>
    </div>
  )
}

export default Admonition
