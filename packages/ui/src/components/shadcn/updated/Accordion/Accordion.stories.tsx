// Button.stories.ts|tsx

import type { Meta, StoryObj } from '@storybook/react'

import { Accordion, AccordionItem } from './Accordion'
import { Badge } from '../../../Badge'

const meta: Meta<typeof Accordion> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'General/Accordion',
  component: Accordion,
}

export default meta

type Story = StoryObj<typeof Accordion>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */

export const Default = {
  args: {
    type: 'default',
  },
  render: ({ children, type }: any) => (
    <Accordion type={type} openBehaviour="single" collapsible className="w-full">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>
          <span className="text-scale-900 group-hover:text-scale-1200">Title of the thing</span>
        </Accordion.Trigger>
        <Accordion.Content>Yes. It adheres to the WAI-ARIA design pattern.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Is it styled?</Accordion.Trigger>
        <Accordion.Content>
          Yes. It comes with default styles that matches the other components' aesthetic.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-3">
        <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        <Accordion.Content>
          Yes. It's animated by default, but you can disable it if you prefer.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
}

export const Bordered = {
  args: {
    type: 'bordered',
  },
  render: ({ children, type }: any) => (
    <Accordion type={type} openBehaviour="single" collapsible className="w-full">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        <Accordion.Content>Yes. It adheres to the WAI-ARIA design pattern.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Is it styled?</Accordion.Trigger>
        <Accordion.Content>
          Yes. It comes with default styles that matches the other components' aesthetic.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-3">
        <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        <Accordion.Content>
          Yes. It's animated by default, but you can disable it if you prefer.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
}
