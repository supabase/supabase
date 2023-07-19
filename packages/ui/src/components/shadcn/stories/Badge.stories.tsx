import { Badge, BadgeProps } from '@ui/components/shadcn/ui/badge'
import { Meta } from '@storybook/react'

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

export const Secondary = () => <Badge variant="secondary">Secondary</Badge>

Secondary.storyName = 'Secondary'

export const Outline = () => <Badge variant="outline">Outline</Badge>

Outline.storyName = 'Outline'

export const Destructive = () => <Badge variant="destructive">Destructive</Badge>

Destructive.storyName = 'Destructive'

export default meta
