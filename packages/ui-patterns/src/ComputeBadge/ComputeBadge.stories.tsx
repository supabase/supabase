import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { ComputeBadge } from './'

const meta = {
  title: 'UI Patterns/ComputeBadge',
  component: ComputeBadge,
  args: {
    infraComputeSize: 'pico',
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ComputeBadge>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  play: async ({ args, canvas }) => {
    if (args.infraComputeSize) {
      await expect(canvas.getByText(args.infraComputeSize)).toBeVisible()
    }
  },
}
