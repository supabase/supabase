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
    ? 'text-white bg-brand-600 hover:bg-brand-700'
    : 'text-black bg-none'

  const renderButton = () => (
    <button
      type="button"
      className={`
        mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium 
        rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
        group transition
        ${colorClass} ${className}
      `}
    >
      <span className={`relative transition-all ${url ? 'left-3 group-hover:left-0' : ''}`}>{text}</span>
      { url && <span className="ml-2 transition-all opacity-0 group-hover:opacity-100">→</span> }
    </button>
  )

  return (
    url
      ? <a href={url}>{renderButton()}</a>
      : renderButton()
  )
}

export default Button