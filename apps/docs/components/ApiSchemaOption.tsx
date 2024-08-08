import { type FC, type PropsWithChildren, useState } from 'react'
import {
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  IconXCircle,
  cn,
} from 'ui'
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
    <Collapsible_Shadcn_ open={open} onOpenChange={setOpen} className="mt-0">
      <CollapsibleTrigger_Shadcn_ asChild>
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
          <IconXCircle size={14} className={open ? '' : 'rotate-45'} />
          {`${!open ? `Open` : `Close`} ${props.name ?? 'object schema'}`}
        </button>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_>{props.children}</CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

ApiSchemaOptions.Option = ApiSchema

export default ApiSchemaOptions
