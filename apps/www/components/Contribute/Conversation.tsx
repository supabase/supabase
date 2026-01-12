import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge, Card, CardContent } from 'ui'
import { getThreadRepliesById } from '~/data/contribute'
import type { ThreadRow } from '~/types/contribute'
import { HelpOnPlatformButton } from './HelpOnPlatformButton'
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
    <div className="flex flex-col gap-10">
      {/* Title, Question, and First Reply Section */}
      {question && question.content && (
        <div className="bg-surface-200 p-6 rounded-lg border border-border">
          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {thread.channel === 'discord' && <DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
                {thread.channel === 'reddit' && <RedditIcon className="h-5 w-5 text-[#FF4500]" />}
                {thread.channel === 'github' && <GitHubIcon className="h-5 w-5 text-foreground" />}
                <span className="text-sm text-foreground-lighter capitalize">{thread.channel}</span>
                <span className="text-sm text-foreground-lighter">·</span>
                <span className="text-sm text-foreground-lighter">{thread.posted}</span>
              </div>
              <HelpOnPlatformButton
                channel={thread.channel}
                externalActivityUrl={thread.external_activity_url}
              />
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
              {question.author && question.ts && <span>·</span>}
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
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">How to help</h3>
          <Card>
            <CardContent className="px-6 py-8 flex flex-col gap-6">
              <div className="text-base text-foreground">
                <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                  {thread.summary}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
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
