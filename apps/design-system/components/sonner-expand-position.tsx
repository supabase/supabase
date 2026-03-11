import { ComponentProps } from 'react'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SonnerToaster,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useConfig } from '@/hooks/use-config'

function SonnerPositionConfig() {
  const [config, setConfig] = useConfig()

  type Position = NonNullable<ComponentProps<typeof SonnerToaster>['position']>

  const positions: Position[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top-center',
    'bottom-center',
  ]

  return (
    <div className="px-5 py-5 border rounded-lg my-2 bg-surface-75">
      <form>
        <FormItemLayout
          name="sonnerExpand"
          id="sonnerExpand"
          isReactForm={false}
          label="Use position prop"
          description="You will need to fire a few Sonner toasts first"
          layout="flex"
        >
          <Select_Shadcn_
            value={config.sonnerPosition}
            defaultValue={config.sonnerPosition}
            onValueChange={(e: Position) => {
              setConfig({
                ...config,
                sonnerPosition: e,
              })
            }}
          >
            <SelectTrigger_Shadcn_ className="w-[180px]">
              <SelectValue_Shadcn_ placeholder="Select a position" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                <SelectLabel_Shadcn_>Positions available</SelectLabel_Shadcn_>
                {positions.map((position) => (
                  <SelectItem_Shadcn_ key={position} value={position}>
                    {position}
                  </SelectItem_Shadcn_>
                ))}
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormItemLayout>
      </form>
    </div>
  )
}

export { SonnerPositionConfig }
