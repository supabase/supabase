import { ComponentProps } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
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
          <Select
            value={config.sonnerPosition}
            defaultValue={config.sonnerPosition}
            onValueChange={(e: Position) => {
              setConfig({
                ...config,
                sonnerPosition: e,
              })
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Positions available</SelectLabel>
                {positions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormItemLayout>
      </form>
    </div>
  )
}

export { SonnerPositionConfig }
