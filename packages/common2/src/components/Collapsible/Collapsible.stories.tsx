import React from 'react'
// import { AutoForm } from 'uniforms'

import { Collapsible } from '.'
import { IconChevronUp } from '../..'
import { Button } from '../Button'

export default {
  title: 'Displays/Collapsible',
  component: Collapsible,
}

export const Default = (args: any) => {
  return (
    <>
      hello all
      <Collapsible className="-space-y-px">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="group text-scale-1200 flex justify-between items-center w-full bg-scale-300 rounded border border-scale-500 p-3"
          >
            Hello
            <div className="flex gap-2 items-center">
              <IconChevronUp className="transition data-open-parent:rotate-0 data-closed-parent:rotate-180" />
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                Turn it on
              </Button>
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="group text-scale-1200 flex justify-between items-center w-full bg-scale-300 rounded border border-scale-500 p-3">
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
            <h3 className="text-tomato-900">I am content</h3>
          </div>
        </Collapsible.Content>
      </Collapsible>
      <Collapsible>
        <Collapsible.Trigger asChild>
          <button type="button">Hello</button>
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
