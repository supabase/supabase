import React from 'react'

import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'
import { IconContext } from './IconContext'
// @ts-ignore
// import IconStyles from './Icon.module.css'

interface Props {
  className?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | number
  type?: string
  color?: string
  strokeWidth?: number
  fill?: string
  stroke?: string
  background?: 'brand' | 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
  src?: React.ReactNode
  icon?: any
  viewBox?: string
}

interface StringMap {
  [key: string]: number
}

function IconBase({
  className,
  size,
  type = 'Mail',
  color,
  strokeWidth,
  fill = undefined,
  stroke = undefined,
  background,
  src,
  icon,
  ...props
}: Props) {
  const __styles = styleHandler('icon')

  return (
    <IconContext.Consumer>
      {({ contextSize, className: contextClassName }) => {
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
        // @ts-ignore

        const FeatherIcon = icon

        // const iconSize = typeof size === 'string' ? defaultSizes[contextSize] : 21
        let iconSize: any = 21

        // use contextSize of parent (via context hook) if one exists
        if (contextSize) {
          iconSize = contextSize
            ? typeof contextSize === 'string'
              ? defaultSizes[contextSize]
              : contextSize
            : defaultSize
        }

        // use size prop of this component if one exists
        if (size) {
          iconSize = size ? (typeof size === 'string' ? defaultSizes[size] : size) : defaultSize
        }

        // confitional used for Icons with no color settings
        // default these icons to use 'currentColor' ie, the text color
        const noColor = !color && !fill && !stroke

        let classes = ['sbui-icon', className]
        if (contextClassName) {
          classes.push(contextClassName)
        }

        const IconComponent = () => (
          <FeatherIcon
            color={!noColor ? color : 'currentColor'}
            stroke={!noColor ? stroke : 'currentColor'}
            className={cn(classes)}
            strokeWidth={strokeWidth}
            size={iconSize}
            fill={!noColor ? (fill ? fill : 'none') : 'none'}
            {...props}
          />
        )

        const Icon = src ? (
          // custom SVG file
          <div className="relative" style={{ width: iconSize + 'px', height: iconSize + 'px' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              color={!noColor ? color : 'currentColor'}
              fill={!noColor ? (fill ? fill : 'none') : 'none'}
              stroke={!noColor ? stroke : 'currentColor'}
              className={cn(classes)}
              width="100%"
              height="100%"
              strokeWidth={strokeWidth ?? undefined}
              {...props}
            >
              {/* Import custom icon path from svg with 16x16px viewport */}
              {src}
            </svg>
          </div>
        ) : (
          // feather icon
          IconComponent()
        )

        return background ? <div className={__styles.container}>{Icon}</div> : Icon
      }}
    </IconContext.Consumer>
  )
}

export default IconBase
