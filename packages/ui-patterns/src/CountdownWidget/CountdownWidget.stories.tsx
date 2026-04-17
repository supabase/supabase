import { CountdownWidget } from '.'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

const meta = {
  title: 'UI Patterns/CountdownWidget',
  component: CountdownWidget,
  args: {
    days: '2',
    hours: '3',
    minutes: '30',
    seconds: '45',
    showCard: true,
    size: 'small',
  },
  argTypes: {
    size: {
      options: ['small', 'large'],
      control: { type: 'radio' },
    },
  },
} satisfies Meta<typeof CountdownWidget>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('45')).toBeVisible()
    await expect(canvas.getByText('30')).toBeVisible()
    await expect(canvas.getByText('03')).toBeVisible()
    await expect(canvas.getByText('02')).toBeVisible()
  },
}

export const Single: Story = {
  args: {
    days: undefined,
    hours: undefined,
    minutes: undefined,
    seconds: '9',
    showCard: true,
    size: 'small',
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('09')).toBeVisible()
  },
}
