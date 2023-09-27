import ReactMarkdown from 'react-markdown'

const FormHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="mb-6">
      <h3 className="text-foreground mb-2 text-xl">
        <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
          {title}
        </ReactMarkdown>
      </h3>
      {description && (
        <div className="text-foreground-lighter text-sm">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export { FormHeader }
