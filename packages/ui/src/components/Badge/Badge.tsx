import styleHandler from '../../lib/theme/styleHandler'

interface Props {
  color?:
    | 'brand'
    | 'scale'
    | 'tomato'
    | 'red'
    | 'crimson'
    | 'pink'
    | 'plum'
    | 'purple'
    | 'violet'
    | 'indigo'
    | 'blue'
    | 'cyan'
    | 'teal'
    | 'green'
    | 'grass'
    | 'brown'
    | 'orange'
    | 'sky'
    | 'mint'
    | 'lime'
    | 'yellow'
    | 'amber'
    | 'gold'
    | 'bronze'
    | 'gray'
    | 'mauve'
    | 'slate'
    | 'sage'
    | 'olive'
    | 'sand'
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
    <span className={classes.join(' ')}>
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
