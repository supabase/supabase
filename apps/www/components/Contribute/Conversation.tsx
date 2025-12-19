import { Badge } from 'ui'
import { getThreadRepliesById } from '~/data/contribute'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const markdownComponents: Components = {
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        {...props}
        className="bg-surface-200 text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
      />
    ) : (
      <code {...props} className="font-mono text-sm" />
    ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="bg-surface-200 text-foreground p-4 rounded-lg overflow-x-auto mb-3 max-w-full"
    />
  ),
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-brand hover:underline break-words"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  p: ({ node, ...props }) => <p {...props} className="mb-3 last:mb-0" />,
  ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1 mb-3" />,
  ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1 mb-3" />,
}

export async function Conversation({ thread_key }: { thread_key: string | null }) {
  const { question, replies } = await getThreadRepliesById(thread_key)

  if (!question && replies.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="grid gap-4">
        {question && question.content && (
          <div className="border border-border rounded-lg p-4 bg-surface-100 min-w-0">
            <div className="text-foreground mb-3 min-w-0">
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {question.content}
              </ReactMarkdown>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {question.author && (
                <>
                  <Badge variant="success">OP</Badge>
                  <span>{question.author}</span>
                </>
              )}
              {question.author && question.ts && <span>•</span>}
              {question.ts && question.external_activity_url ? (
                <a
                  href={question.external_activity_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {new Date(question.ts).toLocaleString()}
                </a>
              ) : (
                question.ts && <span>{new Date(question.ts).toLocaleString()}</span>
              )}
            </div>
          </div>
        )}
        {replies
          .filter((reply: { content: string | null }) => reply.content)
          .map(
            (reply: {
              id: string
              content: string | null
              author: string | null
              ts: string | null
              external_activity_url: string | null
            }) => {
              const timestamp = reply.ts ? new Date(reply.ts).toLocaleString() : null
              const isOP = reply.author === question?.author

              return (
                <div
                  key={reply.id}
                  className="border border-border rounded-lg p-4 bg-surface-100 min-w-0"
                >
                  <div className="text-foreground mb-3 min-w-0">
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                      {reply.content || ''}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {reply.author && (
                      <>
                        {isOP && <Badge variant="success">OP</Badge>}
                        <span>{reply.author}</span>
                      </>
                    )}
                    {reply.author && timestamp && <span>•</span>}
                    {timestamp && reply.external_activity_url ? (
                      <a
                        href={reply.external_activity_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {timestamp}
                      </a>
                    ) : (
                      timestamp && <span>{timestamp}</span>
                    )}
                  </div>
                </div>
              )
            }
          )}
      </div>
    </div>
  )
}
