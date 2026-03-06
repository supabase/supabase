import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { getThreadRepliesById } from '~/data/contribute'
import type { ThreadRow } from '~/types/contribute'
import { HelpOnPlatformButton } from './HelpOnPlatformButton'
import { ChannelIcon } from './Icons'
import { markdownComponents } from './markdownComponents'
import { RepliesList } from './RepliesList'
import { SimilarSolvedThreads } from './SimilarSolvedThreads'

export async function Conversation({ thread }: { thread: ThreadRow }) {
  const { question, replies } = await getThreadRepliesById(thread.thread_key)

  if (!question && replies.length === 0) {
    return null
  }

  const validReplies = replies.filter((reply: { content: string | null }) => reply.content)
  const productAreas = thread.product_areas.filter((a: string) => a !== 'Other')
  const stackItems = thread.stack.filter((t: string) => t !== 'Other')
  const hasMetadata = productAreas.length > 0 || stackItems.length > 0

  return (
    <div className="flex flex-col gap-10">
      {/* Title, Question, and First Reply Section */}
      {question && question.content && (
        <div className="bg-surface-200 p-[var(--card-padding-x)] rounded-lg flex flex-col gap-6">
          {/* Platform, Date, Author, Title */}
          <header className="flex flex-col gap-3">
            {/* Platform, Date, Author - logo spans both rows; platform/date and author link out */}
            <div className="flex items-stretch gap-3">
              <a
                href={thread.external_activity_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-surface-400 h-10 w-10 rounded-md shrink-0 self-stretch hover:opacity-80 transition-opacity"
              >
                <ChannelIcon channel={thread.channel} />
              </a>
              <div className="flex flex-col gap-0.5 justify-center min-w-0 text-left">
                <a
                  href={thread.external_activity_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-foreground-light hover:text-foreground transition-colors"
                >
                  {thread.channelDisplayName} · {thread.posted}
                </a>
                <Link
                  href={`/contribute/u/${encodeURIComponent(thread.user)}`}
                  className="text-xs text-foreground-light hover:text-foreground transition-colors"
                >
                  {thread.user}
                </Link>
              </div>
            </div>

            <a
              href={thread.external_activity_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl font-medium text-foreground text-balance">{thread.title}</h1>
            </a>

            {/* Product areas and stack */}
            {hasMetadata && (
              <div className="flex flex-wrap gap-0.5 items-center">
                {productAreas.map((area: string) => (
                  <Badge key={area} variant="default">
                    {area}
                  </Badge>
                ))}
                {productAreas.length > 0 && stackItems.length > 0 && (
                  <span className="text-muted-foreground px-0.5">·</span>
                )}
                {stackItems.map((tech: string) => (
                  <Badge key={tech} variant="default">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Question */}
          <div className="border border-border rounded-lg p-6 bg-surface-100 min-w-0 shadow-sm">
            <div className="text-foreground min-w-0">
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {question.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      {thread.summary && (
        <Card>
          <CardHeader>
            <CardTitle>How to help</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-8 flex flex-col gap-6">
            <div className="text-base text-foreground">
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {thread.summary}
              </ReactMarkdown>
            </div>
            {/* CTA Button */}
            <div>
              <HelpOnPlatformButton
                channel={thread.channel}
                externalActivityUrl={thread.external_activity_url}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Solved Threads */}
      {thread.similar_solved_threads && thread.similar_solved_threads.length > 0 && (
        <SimilarSolvedThreads threads={thread.similar_solved_threads} parentThreadId={thread.id} />
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
