import { XCircle } from 'lucide-react'
import { type FC, type PropsWithChildren, useState } from 'react'
import { CollapsibleContent, CollapsibleTrigger, Collapsible, cn } from 'ui'
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
    <Collapsible open={open} onOpenChange={setOpen} className="mt-0">
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'px-5',
            'border-t border-l border-r border-default',
            'text-left text-sm text-foreground-light',
            'hover:bg-surface-100 transition-all',
            'flex items-center gap-2',
            open ? 'w-full py-1.5 rounded-tl-lg rounded-tr-lg' : 'py-1 border-b rounded-full'
          )}
        >
          <XCircle size={14} className={open ? '' : 'rotate-45'} />
          {`${!open ? `Open` : `Close`} ${props.name ?? 'object schema'}`}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{props.children}</CollapsibleContent>
    </Collapsible>
  )
}

ApiSchemaOptions.Option = ApiSchema

export default ApiSchemaOptions
