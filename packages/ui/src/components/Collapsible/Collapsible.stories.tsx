import { Collapsible } from './'
import { IconChevronUp } from '../../components/Icon/icons/IconChevronUp'
import { Button } from './../Button'

export default {
  title: 'Displays/Collapsible',
  component: Collapsible,
}

export const Default = (args: any) => {
  return (
    <>
      <Collapsible className="-space-y-px">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="group text-foreground flex justify-between items-center w-full bg-surface-100 rounded border border-default p-3"
          >
            <div className="flex gap-2 items-center">
              <IconChevronUp className="transition data-open-parent:rotate-0 data-closed-parent:rotate-180" />
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                Example button
              </Button>
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="group text-foreground flex justify-between items-center w-full bg-surface-100 rounded border border-default p-3">
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
          </div>
        </Collapsible.Content>
      </Collapsible>
      <Collapsible>
        <Collapsible.Trigger asChild>
          <button type="button">Click me to expand</button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
          </div>
        </Collapsible.Content>
      </Collapsible>
    </>
  )
}

Default.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Name',
  layout: 'vertical',
}
