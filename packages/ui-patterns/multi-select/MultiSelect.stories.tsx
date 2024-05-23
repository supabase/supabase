import { useArgs } from '@storybook/preview-api'
import { StoryObj } from '@storybook/react'
import { Button, IconUserPlus } from 'ui'
import TextConfirmModal from './../Dialogs/TextConfirmModal'
import { useState } from 'react'

import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorTrigger,
  MultiSelectorList,
  MultiSelectorItem,
} from './MultiSelect'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Patterns/MultiSelect',
  component: MultiSelector,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
}

type Story = StoryObj<typeof MultiSelector>

export const Primary = () => {
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */

  const [value, setValue] = useState<string[]>([])

  return (
    <MultiSelector values={value} onValuesChange={setValue}>
      <MultiSelectorTrigger>
        <MultiSelectorInput placeholder="Select items" />
      </MultiSelectorTrigger>
      <MultiSelectorContent>
        <MultiSelectorList>
          <MultiSelectorItem value="1">Item 1</MultiSelectorItem>
          <MultiSelectorItem value="2">Item 2</MultiSelectorItem>
          <MultiSelectorItem value="3">Item 3</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
