import { COLORS } from '../../lib/constants'
import { Badge } from './'

export default {
  title: 'Displays/Badge',
  component: Badge,
}

const sizes: string[] = ['small', 'large']

export const Default = (args: any) => <Badge {...args}>Hello world</Badge>

export const withColor = (args: any) => <Badge {...args}>Hello world</Badge>

export const withDot = (args: any) => <Badge {...args}>Hello world</Badge>

export const large = (args: any) => <Badge {...args}>Hello world</Badge>

export const withDotLarge = (args: any) => <Badge {...args}>Hello world</Badge>

export const withCustomClassNames = (args: any) => <Badge {...args}>Hello world</Badge>

export const allBadges = () => (
  <>
    <div className="flex flex-row gap-6 mx-auto my-4">
      {sizes.map((size, sizeIndex) => (
        <>
          <h3 className="text-scale-900">{size}</h3>
          <div className="flex flex-col gap-2">
            {COLORS.map((x, colorIndex) => (
              // @ts-ignore
              <Badge size={sizes[sizeIndex]} color={colors[colorIndex]}>
                Supabase
              </Badge>
            ))}
          </div>
        </>
      ))}
    </div>
  </>
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
