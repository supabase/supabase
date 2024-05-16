import { FC, PropsWithChildren, useState } from 'react'
import { IconXCircle } from '~/../../packages/ui'
import ApiSchema from '~/components/ApiSchema'

interface IOptions {
  name?: string
}

type IOption = any

type OptionsSubComponents = {
  Option: IOption
}

const ApiSchemaOptions: FC<PropsWithChildren<IOptions>> & OptionsSubComponents = (props) => {
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
        {`${!open ? `Open` : `Close`} ${props.name ?? 'object schema'}`}
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

ApiSchemaOptions.Option = ApiSchema

export default ApiSchemaOptions
