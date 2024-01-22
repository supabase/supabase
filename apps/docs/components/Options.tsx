import { FC, PropsWithChildren, useState } from 'react'
import { IconXCircle } from '~/../../packages/ui'

interface IOptions {
  name?: string
}

type IOption = any

type OptionsSubComponents = {
  Option: IOption
}

const Options: FC<PropsWithChildren<IOptions>> & OptionsSubComponents = (props) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-0">
      <button
        className={[
          'px-5',
          'border-t border-l border-r border-default',
          'text-left text-sm text-foreground-light',
          'hover:bg-surface-100 transition-all',

          'flex items-center gap-2',
          open ? 'w-full py-1.5 rounded-tl-lg rounded-tr-lg' : 'py-1 border-b rounded-full',
        ].join(' ')}
        onClick={() => setOpen(!open)}
      >
        <div>
          <div className={[!open ? 'rotate-45' : 'rotate-0'].join(' ')}>
            <IconXCircle size={14} />
          </div>
        </div>
        {`${!open ? `Open` : `Close`} ${props.name ?? 'accepted values'}`}
      </button>
      <div
        className={['transition-all opacity-0', open ? 'opacity-100 h-auto' : 'invisible h-0'].join(
          ' '
        )}
      >
        {props.children}
      </div>
    </div>
  )
}

const Option: FC<IOption> = (props) => {
  return (
    <div
      className="
        px-5 py-3 first:border-t border-b border-l border-r
        border-default
        last:rounded-bl-lg last:rounded-br-lg
        flex flex-col gap-3
      "
    >
      <div className="flex gap-3 items-center">
        <span className="text-sm text-foreground font-mono font-medium">
          {props.name ?? 'no-name'}
        </span>
        <span>
          {props.isOptional ? (
            <div className="text-[10px] px-3 tracking-wide font-mono text-foreground-lighter">
              Optional
            </div>
          ) : (
            <div className="text-[10px] border border-amber-700 bg-amber-300 text-amber-900 px-2 tracking-wide font-mono py-0.25 rounded-full">
              REQUIRED
            </div>
          )}
        </span>
        <span className="text-foreground-muted text-xs">{props.type ?? 'no type'}</span>
      </div>

      {props.description && (
        <p className="text-sm text-foreground-lighter m-0">{props.description}</p>
      )}

      {props.children}
    </div>
  )
}

Options.Option = Option

export default Options
