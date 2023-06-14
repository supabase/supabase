import { COLORS } from '../../lib/constants'
import { Badge } from './'
import { Props } from './Badge'

export default {
  title: 'Displays/Badge',
  component: Badge,
}

const sizes = ['small', 'large'] as const

export const Default = (args: Props) => <Badge {...args}>Hello world</Badge>

export const withColor = (args: Props) => <Badge {...args}>Hello world</Badge>

export const withDot = (args: Props) => <Badge {...args}>Hello world</Badge>

export const large = (args: Props) => <Badge {...args}>Hello world</Badge>

export const withDotLarge = (args: Props) => <Badge {...args}>Hello world</Badge>

export const withCustomClassNames = (args: Props) => <Badge {...args}>Hello world</Badge>

export const allBadges = () => (
  <div className="flex flex-row gap-6 mx-auto my-4">
    {sizes.map((size) => (
      <>
        <h3 className="text-scale-900">{size}</h3>
        <div className="flex flex-col gap-2">
          {COLORS.map((color) => (
            <Badge size={size} color={color}>
              Supabase
            </Badge>
          ))}
        </div>
      </>
    ))}
  </div>
)

Default.args = {}

withColor.args = {
  color: 'red',
}

withDot.args = {
  dot: true,
}

large.args = {
  size: 'large',
}

withDotLarge.args = {
  size: 'large',
  dot: true,
}

withCustomClassNames.args = {
  className: 'border-teal-100 border-2',
}
