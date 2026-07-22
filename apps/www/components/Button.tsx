type Props = {
  type?: 'primary' | 'secondary'
  text: string
  url?: string
  className?: string
  hideArrow?: boolean
}

const Button = (props: Props) => {
  const { type = 'primary', text, url, className, hideArrow = false } = props

  const colorClass =
    type === 'primary'
      ? 'px-3 py-2 shadow-xs border border-transparent text-white bg-brand-400 hover:bg-brand-300 focus:ring-2 focus:ring-offset-2 focus:ring-brand-300'
      : 'text-brand-400 bg-none'

  const textClass = type === 'primary' ? 'font-medium left-3 group-hover:left-0' : 'font-normal'

  const arrowClass = type === 'primary' ? '' : 'relative -left-1 group-hover:left-0'

  let buttonStyles = {
    textShadow: 'none',
  }
  if (type === 'primary') {
    buttonStyles.textShadow = '0px 0px 6px rgba(13, 128, 86, 0.8)'
  }

  const sharedClassName = `
        group inline-flex items-center rounded-md text-sm
        leading-4 transition focus:outline-hidden ${colorClass} ${className}
      `

  const content = (
    <>
      <span
        className={`
        relative transition-all ${url ? textClass : ''}
      `}
      >
        {text}
      </span>
      {url && !hideArrow && (
        <span className={`ml-2 opacity-0 transition-all group-hover:opacity-100 ${arrowClass}`}>
          →
        </span>
      )}
    </>
  )

  if (url) {
    return (
      <a href={url} className={sharedClassName} style={buttonStyles}>
        {content}
      </a>
    )
  }

  return (
    <button tabIndex={0} type="button" className={sharedClassName} style={buttonStyles}>
      {content}
    </button>
  )
}

export default Button
