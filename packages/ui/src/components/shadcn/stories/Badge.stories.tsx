import { Badge } from '@ui/components/shadcn/ui/badge'
import { Meta } from '@storybook/react'

const meta: Meta = {
  title: 'shadcn/Badge',
  component: Badge,
}

export const Default = () => <Badge>Badge</Badge>

Default.storyName = 'Default'

export const Secondary = () => <Badge variant="secondary">Secondary</Badge>

Secondary.storyName = 'Secondary'

export const Outline = () => <Badge variant="outline">Outline</Badge>

Outline.storyName = 'Outline'

export const Destructive = () => <Badge variant="destructive">Destructive</Badge>

Destructive.storyName = 'Destructive'

export default meta
