import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from 'ui'
import { getThreadRepliesById } from '~/data/contribute'
import type { ThreadRow } from '~/types/contribute'
import { DiscordIcon, GitHubIcon, RedditIcon } from './Icons'
import { markdownComponents } from './markdownComponents'
import { RepliesList } from './RepliesList'

export async function Conversation({ thread }: { thread: ThreadRow }) {
  const { question, replies } = await getThreadRepliesById(thread.thread_key)

  if (!question && replies.length === 0) {
    return null
  }

  const validReplies = replies.filter((reply: { content: string | null }) => reply.content)

  return (
    <div className="mb-6 ">
      {/* Title, Question, and First Reply Section */}
      {question && question.content && (
        <div className="mb-6 bg-surface-200 p-6 rounded-lg border border-border">
          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              {thread.channel === 'discord' && <DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
              {thread.channel === 'reddit' && <RedditIcon className="h-5 w-5 text-[#FF4500]" />}
              {thread.channel === 'github' && <GitHubIcon className="h-5 w-5 text-foreground" />}
              <span className="text-sm text-foreground-lighter capitalize">{thread.channel}</span>
              <span className="text-sm text-foreground-lighter">•</span>
              <span className="text-sm text-foreground-lighter">{thread.posted}</span>
            </div>
            <h1 className="text-2xl font-medium text-foreground mb-2">{thread.title}</h1>
            <p className="text-sm text-foreground-lighter">
              by{' '}
              <Link
                href={`/contribute/u/${encodeURIComponent(thread.user)}`}
                className="hover:text-foreground transition-colors"
              >
                {thread.user}
              </Link>
            </p>
          </div>

          {/* Question */}
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
      {thread.summary && (
        <div className="mb-6">
          <div className="p-4 min-w-0 border border-border rounded-lg bg-surface-100">
            <h3 className="text-sm font-medium text-foreground mb-2">Thread summary</h3>
            <p className="text-base text-foreground-light">{thread.summary}</p>
          </div>
        </div>
      )}

      {/* Remaining Replies Section */}
      {validReplies.length > 0 && (
        <RepliesList
          replies={validReplies}
          questionAuthor={question?.author || null}
          totalReplyCount={validReplies.length}
        />
      )}
    </div>
  )
}
