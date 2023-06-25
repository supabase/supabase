import ReactMarkdown from 'react-markdown'

const FormHeader = ({
  title,
  description,
  className,
}: {
  title: string
  description?: string
  className?: string
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-scale-1200 mb-2 text-xl">
        <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
          {title}
        </ReactMarkdown>
      </h3>
      {description && (
        <div className="text-scale-900 text-sm">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export { FormHeader }
