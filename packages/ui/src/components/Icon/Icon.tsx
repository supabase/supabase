import React from 'react'
import { IconContext } from './IconContext'

import styleHandler from '../../lib/theme/styleHandler'
// @ts-ignore
// import IconStyles from './Icon.module.css'

const IconStyles = {}

interface Props {
  className?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | number
  type?: string
  color?: string
  strokeWidth?: number
  fill?: string
  stroke?: string
  background?: 'brand' | 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
  src: React.ReactNode
}

interface StringMap {
  [key: string]: number
}

function Icon({
  className,
  size,
  type,
  color,
  strokeWidth,
  fill = undefined,
  stroke = undefined,
  background,
  src,
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

        const Icon = (
          // custom SVG file
          <svg
            xmlns="http://www.w3.org/2000/svg"
            color={!noColor ? color : 'currentColor'}
            fill={!noColor ? (fill ? fill : 'none') : 'none'}
            stroke={!noColor ? stroke : 'currentColor'}
            strokeWidth={strokeWidth}
            className={classes.join(' ')}
            width={iconSize}
            height={iconSize}
            {...props}
          >
            {src}
          </svg>
        )

        return background ? (
          <div
            // circle coloured background
            className={__styles.container}
          >
            {Icon}
          </div>
        ) : (
          Icon
        )
      }}
    </IconContext.Consumer>
  )
}

export default Icon
