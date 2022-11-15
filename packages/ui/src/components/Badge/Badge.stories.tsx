import { Badge } from './'

export default {
  title: 'Displays/Badge',
  component: Badge,
}

const colors = [
  'brand',
  'scale',
  'tomato',
  'red',
  'crimson',
  'pink',
  'plum',
  'purple',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'grass',
  'brown',
  'orange',
  'sky',
  'mint',
  'lime',
  'yellow',
  'amber',
  'gold',
  'bronze',
  'gray',
  'mauve',
  'slate',
  'sage',
  'olive',
  'sand',
]

const sizes: string[] = ['small', 'large']

export const Default = (args: any) => <Badge {...args}>Hello world</Badge>

export const withColor = (args: any) => <Badge {...args}>Hello world</Badge>

export const withDot = (args: any) => <Badge {...args}>Hello world</Badge>

export const large = (args: any) => <Badge {...args}>Hello world</Badge>

export const withDotLarge = (args: any) => <Badge {...args}>Hello world</Badge>

export const withCustomClassNames = (args: any) => (
  <Badge {...args}>Hello world</Badge>
)

export const allBadges = () => (
  <>
    <div className="flex flex-row gap-6 mx-auto my-4">
      {sizes.map((size, sizeIndex) => (
        <>
          <h3 className="text-scale-900">{size}</h3>
          <div className="flex flex-col gap-2">
            {colors.map((x, colorIndex) => (
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
  className: 'border-teal-100 border-2'
}
