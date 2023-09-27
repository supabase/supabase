import { Markdown } from '../Markdown'

interface ContentSnippetProps {
  snippet: {
    title: string
    description: string
  }
}

const ContentSnippet = ({ snippet }: ContentSnippetProps) => {
  return (
    <div className="p-4 space-y-3">
      <h2 className="doc-heading">{snippet.title}</h2>
      <div className="doc-section">
        <article className="text text-sm text-light">
          <Markdown content={snippet.description} />
        </article>
      </div>
    </div>
  )
}
export default ContentSnippet
