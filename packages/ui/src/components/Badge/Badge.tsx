import { AvailableColors } from '../../lib/constants'
import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils'

interface Props {
  color?: AvailableColors
  children: string | React.ReactNode
  size?: 'large' | 'small'
  dot?: boolean
  className?: string
}

function Badge({ color = 'brand', children, size, dot, className }: Props) {
  const __styles = styleHandler('badge')

  let classes = [__styles.base]
  if (color) {
    classes.push(__styles.color[color])
  }
  if (size === 'large') {
    classes.push(__styles.size.large)
  }
  if (className) {
    classes.push(className)
  }

  return (
    <span className={cn(classes)}>
      {dot && (
        <svg
          className={`${__styles.dot} ${__styles.color[color]}`}
          fill="currentColor"
          viewBox="0 0 8 8"
        >
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}

      {children}
    </span>
  )
}
export default Badge
