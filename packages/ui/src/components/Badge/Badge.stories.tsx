import type { Meta, StoryObj } from '@storybook/react'
import { Badge, BadgeProps } from './Badge'

const meta: Meta<typeof Badge> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'General/Badge',
  component: Badge,
}

export default meta

type Story = StoryObj<typeof Badge>

export const Outline = {
  args: {
    variant: 'outline',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Brand = {
  args: {
    variant: 'brand',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Scale = {
  args: {
    variant: 'scale',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Tomato = {
  args: {
    variant: 'tomato',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Red = {
  args: {
    variant: 'red',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Crimson = {
  args: {
    variant: 'crimson',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Pink = {
  args: {
    variant: 'pink',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Purple = {
  args: {
    variant: 'purple',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Violet = {
  args: {
    variant: 'violet',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Indigo = {
  args: {
    variant: 'indigo',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Blue = {
  args: {
    variant: 'blue',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Green = {
  args: {
    variant: 'green',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Grass = {
  args: {
    variant: 'grass',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Orange = {
  args: {
    variant: 'orange',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Yellow = {
  args: {
    variant: 'yellow',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Amber = {
  args: {
    variant: 'amber',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Gold = {
  args: {
    variant: 'gold',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Gray = {
  args: {
    variant: 'gray',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Slate = {
  args: {
    variant: 'slate',
  },
  render: ({ variant }: BadgeProps) => <Badge variant={variant}>Hello World</Badge>,
}

export const Large = {
  args: {
    size: 'large',
  },
  render: ({ size }: BadgeProps) => <Badge size={size}>Hello World</Badge>,
}
