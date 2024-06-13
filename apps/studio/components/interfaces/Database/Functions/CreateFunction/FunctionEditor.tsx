import { Maximize2, Minimize2 } from 'lucide-react'

import SqlEditor from 'components/ui/SqlEditor'
import {
  Button,
  FormControl_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'

export const FunctionEditor = ({
  field,
  focused,
  setFocused,
}: {
  field: any
  focused: boolean
  setFocused: (b: boolean) => void
}) => {
  return (
    <div className={cn('rounded-md relative group flex-grow')}>
      <FormControl_Shadcn_>
        <SqlEditor
          defaultValue={field.value}
          onInputChange={(value: string | undefined) => {
            field.onChange(value)
          }}
          contextmenu={false}
        />
      </FormControl_Shadcn_>
      <div
        className={cn(
          'absolute top-0 right-2 bg-surface-300 border border-strong rounded h-[28px]',
          'opacity-0 group-hover:opacity-100 group-hover:top-2 transition-all'
        )}
      >
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="text"
              size="tiny"
              className={cn(
                'px-2 text-foreground-lighter hover:text-foreground',
                'transition z-50'
              )}
              onClick={() => setFocused(!focused)}
              icon={focused ? <Minimize2 /> : <Maximize2 />}
            ></Button>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">
            {focused ? 'Minimize editor' : 'Maximize editor'}
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </div>
    </div>
  )
}
