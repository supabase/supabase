import * as Tooltip from '@radix-ui/react-tooltip'
import { Maximize2, Minimize2 } from 'lucide-react'

import SqlEditor from 'components/ui/SqlEditor'
import { Button, FormControl_Shadcn_, cn } from 'ui'

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
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button
              type="text"
              size="tiny"
              className={cn(
                'px-2 text-foreground-lighter hover:text-foreground',
                'transition z-50'
              )}
              onClick={() => setFocused(!focused)}
            >
              {focused ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  {focused ? 'Minimize editor' : 'Maximize editor'}
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </div>
  )
}
