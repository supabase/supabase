import { Button } from '.'
// Button.stories.ts|tsx

import type { Meta, StoryObj } from '@storybook/react'

import { ButtonProps } from './Button'

import { IconAirplay } from '../Icon/icons/IconAirplay'

const meta: Meta<typeof Button> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'General/Button',
  component: Button,
}

export const Neutral = (args: any) => <Button {...args}>Button text</Button>
export const Success = (args: any) => <Button {...args}>Button text</Button>
export const withStyles = (args: any) => <Button {...args}>Button text</Button>
export const withIcon = (args: any) => <Button {...args}>Button text</Button>
export const withIconRight = (args: any) => <Button {...args}>Button text</Button>
export const withBlock = (args: any) => <Button {...args}>Button text</Button>
export const withOnlyIcon = (args: any) => <Button {...args} />
export const withOnlyLoading = (args: any) => <Button {...args} />
export const withLoadingCentered = (args: any) => (
  <Button {...args}>Loading icon is centered</Button>
)
export default meta

type Story = StoryObj<typeof Button>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */

export const Primary = {
  args: {
    children: 'Hello world',
    type: 'primary',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}
export const Default = {
  args: {
    children: 'Hello world',
    type: 'default',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Alternative = {
  args: {
    children: 'Hello world',
    type: 'alternative',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Outline = {
  args: {
    children: 'Hello world',
    type: 'outline',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Secondary = {
  args: {
    children: 'Hello world',
    type: 'secondary',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Dashed = {
  args: {
    children: 'Hello world',
    type: 'dashed',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Link = {
  args: {
    children: 'Hello world',
    type: 'link',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Text = {
  args: {
    children: 'Hello world',
    type: 'text',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Danger = {
  args: {
    children: 'Hello world',
    type: 'danger',
  },
  render: ({ children, type }: ButtonProps) => <Button type={type}>{children}</Button>,
}

export const Block = {
  args: {
    children: 'Hello world',
    type: 'primary',
    block: true,
  },
  render: ({ children, type, block }: ButtonProps) => (
    <Button block type={type}>
      {children}
    </Button>
  ),
}

export const Disabled = {
  args: {
    children: 'Hello world',
    type: 'primary',
    disabled: true,
  },
  render: ({ children, type, disabled }: ButtonProps) => (
    <Button disabled type={type}>
      {children}
    </Button>
  ),
}

export const Sizes = {
  args: {
    children: 'Change the size below',
    type: 'primary',
    size: 'large',
  },
  render: ({ children, type, size }: ButtonProps) => (
    <Button size={size} type={type}>
      {children}
    </Button>
  ),
}

export const LeftIcon = {
  args: {
    children: 'Change the size below',
    type: 'primary',
    iconLeft: <IconAirplay />,
  },
  render: ({ children, type, iconLeft }: ButtonProps) => (
    <Button iconLeft={iconLeft} type={type}>
      {children}
    </Button>
  ),
}

export const RightIcon = {
  args: {
    children: 'Change the size below',
    type: 'primary',
    iconRight: <IconAirplay />,
  },
  render: ({ children, type, iconRight }: ButtonProps) => (
    <Button iconRight={iconRight} type={type}>
      {children}
    </Button>
  ),
}

export const Loading = {
  args: {
    children: 'Change the size below',
    type: 'primary',
    loading: true,
  },
  render: ({ children, type, loading }: ButtonProps) => (
    <Button loading={loading} type={type}>
      {children}
    </Button>
  ),
}
