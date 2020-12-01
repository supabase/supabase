type Props = {
  type?: 'primary' | 'secondary',
  text: string,
  url?: string,
  className?: string,
}

const Button = (props: Props) => {
  const {
    type = 'primary',
    text, 
    url,
    className
  } = props

  const colorClass = type === 'primary'
    ? 'px-3 py-2 shadow-sm  border border-transparent text-white bg-brand-600 hover:bg-brand-700'
    : 'text-brand-600 bg-none'
  
  const textClass = type === 'primary'
    ? 'font-medium left-3 group-hover:left-0'
    : 'font-normal'

  const arrowClass = type === 'primary'
    ? ''
    : 'relative -left-1 group-hover:left-0'

  const renderButton = () => (
    <button
      type="button"
      className={`
        inline-flex items-center text-sm leading-4 rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
        group transition ${colorClass} ${className}
      `}
    >
      <span className={`
        relative transition-all ${url ? textClass : ''}
      `}>
        {text}
      </span>
      { url && <span className={`ml-2 transition-all opacity-0 group-hover:opacity-100 ${arrowClass}`}>→</span> }
    </button>
  )

  return (
    url
      ? <a href={url}>{renderButton()}</a>
      : renderButton()
  )
}

export default Button