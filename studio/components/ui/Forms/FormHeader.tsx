import ReactMarkdown from 'react-markdown'

const FormHeader = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="mb-6">
      <h3 className="text-scale-1200 mb-2 text-xl">
        <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
          {title}
        </ReactMarkdown>
      </h3>
      <div className="text-scale-900 text-sm">
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>
    </div>
  )
}

export { FormHeader }
