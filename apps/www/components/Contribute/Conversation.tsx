import { Badge } from 'ui'
import { getThreadRepliesById } from '~/data/contribute'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RepliesList } from './RepliesList'
import Link from 'next/link'
import { markdownComponents } from './markdownComponents'

export async function Conversation({
  thread_key,
  summary,
}: {
  thread_key: string | null
  summary?: string | null
}) {
  const { question, replies } = await getThreadRepliesById(thread_key)

  if (!question && replies.length === 0) {
    return null
  }

  const validReplies = replies.filter((reply: { content: string | null }) => reply.content)

  return (
    <div className="mb-6">
      {/* Original Question Section */}
      {question && question.content && (
        <div className="mb-6">
          <div className="border border-border rounded-lg p-6 bg-surface-100 min-w-0 shadow-sm">
            <div className="text-foreground mb-4 min-w-0">
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {question.content}
              </ReactMarkdown>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {question.author && (
                <>
                  <Badge variant="success">OP</Badge>
                  <Link
                    href={`/contribute/u/${encodeURIComponent(question.author)}`}
                    className="font-medium hover:text-foreground transition-colors"
                  >
                    {question.author}
                  </Link>
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
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <div className="mb-6">
          <div className="border border-border rounded-lg p-4 bg-surface-75 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-2">Thread summary</h3>
            <p className="text-sm text-foreground-light">{summary}</p>
          </div>
        </div>
      )}

      {/* Replies Section */}
      <RepliesList replies={validReplies} questionAuthor={question?.author || null} />
    </div>
  )
}
