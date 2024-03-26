import React from 'react'
import { Meta } from '@storybook/react'
import { Badge, BadgeProps } from '../ui/badge'

const meta: Meta = {
  title: 'shadcn/Badge',
  component: Badge,
}

export const Default = (args: JSX.IntrinsicAttributes & BadgeProps) => (
  <Badge {...args}>Badge</Badge>
)

Default.storyName = 'Default'

export const Brand = () => <Badge variant="brand">Brand</Badge>

Brand.storyName = 'Brand'

export const Warning = () => <Badge variant={'warning'}>Warning</Badge>

Warning.storyName = 'Warning'

export const Success = () => <Badge variant="success">Success</Badge>

Success.storyName = 'Success'

export const Destructive = () => <Badge variant="destructive">Destructive</Badge>

Destructive.storyName = 'Destructive'

export const Secondary = () => <Badge variant="secondary">Secondary</Badge>

Secondary.storyName = 'Secondary'

export const Outline = () => <Badge variant="outline">Outline</Badge>

Outline.storyName = 'Outline'

export default meta
