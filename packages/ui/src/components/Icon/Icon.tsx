import { ComponentPropsWithRef, forwardRef } from 'react'
import styleHandler from '../../lib/theme/styleHandler'
import { IconContext } from './IconContext'
import IconNames from './IconNames'
import * as IconFromRF from 'react-feather'

export type Sizes =
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | 'xxlarge'
  | 'xxxlarge'
  | number

type Backgrounds =
  | 'brand'
  | 'gray'
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'

type Icons = (typeof IconNames)[number]

type SizeProps = {
  [Key in 'size' | 'height' | 'width']?: Sizes
}

type Props = SizeProps & {
  background?: Backgrounds
  type?: Icons
  src?: React.ReactNode
}

export type IconProps = Props & ComponentPropsWithRef<'svg'>

type StringMap = {
  [key: string]: number
}

const defaultSizes: StringMap = {
  tiny: 14,
  small: 18,
  medium: 20,
  large: 20,
  xlarge: 24,
  xxlarge: 30,
  xxxlarge: 42,
}

const defaultSize = defaultSizes['large']

let sizeOnUndefined: Sizes = 21

function resolveValueOf<T>(property: T) {
  return typeof property === 'string' ? defaultSizes[property] : property
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      className,
      size,
      height,
      width,
      type = 'Mail',
      strokeWidth,
      color,
      fill = undefined,
      stroke = undefined,
      background,
      src,
      ...props
    },
    ref
  ) => {
    const __styles = styleHandler('icon')

    return (
      <IconContext.Consumer>
        {({ contextSize, className: contextClassName }) => {
          // use contextSize of parent (via context hook) if one exists
          if (contextSize) {
            sizeOnUndefined = contextSize ? defaultSizes[contextSize] : defaultSize
          }

          size = resolveValueOf(size)
          width = resolveValueOf(width)
          height = resolveValueOf(height)

          width = width ?? size ?? height ?? sizeOnUndefined
          height = height ?? size ?? width ?? sizeOnUndefined

          // conditional used for Icons with no color settings
          // default these icons to use 'currentColor' ie, the text color
          const noColor = !color && !fill && !stroke

          let classes = ['sbui-icon', className]

          if (contextClassName) {
            classes.push(contextClassName)
          }

          const SVGProps = {
            xmlns: 'http://www.w3.org/2000/svg',
            ...props,
            ref,
            height,
            width,
            strokeWidth,
            fill: (noColor && 'none') || fill,
            color: noColor ? 'currentColor' : color,
            stroke: noColor ? 'currentColor' : stroke,
            className: background ? [...classes, __styles.container].join(' ') : classes.join(' '),
          }

          const IconTag = IconFromRF[type]

          const IconComponent = () => <IconTag {...SVGProps} />

          const DisplayIcon = src ? (
            // custom SVG file (never seen used in codebase)
            <svg {...SVGProps}>{src}</svg>
          ) : (
            // Icon from Feather Icons
            <IconComponent />
          )

          return DisplayIcon
        }}
      </IconContext.Consumer>
    )
  }
)

export default Icon
