import React from 'react'
import { Button } from './../Button'

import type { Meta, StoryObj } from '@storybook/react'

import { ButtonProps } from './../Button'

import { IconActivity } from '../Icon/icons/IconActivity'

const meta: Meta<typeof Button> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'Old Primitives/Button',
  component: Button,
}

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
    type: 'default',
    icon: <IconActivity />,
  },
  render: ({ children, type, icon }: ButtonProps) => (
    <Button icon={icon} type={type}>
      {children}
    </Button>
  ),
}

export const RightIcon = {
  args: {
    children: 'Change the size below',
    type: 'primary',
    iconRight: <IconActivity />,
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
