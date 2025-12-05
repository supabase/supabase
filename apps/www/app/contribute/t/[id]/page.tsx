import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Button } from 'ui'
import { ArrowLeft } from 'lucide-react'
import DefaultLayout from '~/components/Layouts/Default'
import { getThreadById, getThreadRepliesById } from '~/data/contribute'
import { DiscordIcon, GitHubIcon, RedditIcon } from '~/components/Contribute/Icons'

// eslint-disable-next-line no-restricted-exports
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const thread = await getThreadById(id)
  const { question, replies } = await getThreadRepliesById(thread?.thread_key ?? null)
  console.log('ze thread', { thread })
  if (!thread) {
    notFound()
  }

  return (
    <DefaultLayout>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
          <Link
            href="/contribute"
            className="inline-flex items-center gap-2 text-foreground-lighter hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to threads
          </Link>

          <div className="border border-border rounded-lg p-8 bg-surface-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {thread.channel === 'discord' && (
                    <DiscordIcon className="h-5 w-5 text-[#5865F2]" />
                  )}
                  {thread.channel === 'reddit' && <RedditIcon className="h-5 w-5 text-[#FF4500]" />}
                  {thread.channel === 'github' && <GitHubIcon className="h-5 w-5 text-[#181717]" />}
                  <span className="text-sm text-foreground-lighter capitalize">
                    {thread.channel}
                  </span>
                  <span className="text-sm text-foreground-lighter">•</span>
                  <span className="text-sm text-foreground-lighter">{thread.posted}</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">{thread.title}</h1>
                <p className="text-sm text-foreground-lighter">by {thread.user}</p>
              </div>
            </div>

            {(question || replies.length > 0) && (
              <div className="mb-6">
                <div className="grid gap-4">
                  {question && question.content && (
                    <div className="border border-border rounded-lg p-4 bg-surface-100">
                      <p className="text-foreground mb-3">{question.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {question.author && <span>{question.author}</span>}
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
                        return (
                          <div
                            key={reply.id}
                            className="border border-border rounded-lg p-4 bg-surface-100"
                          >
                            <p className="text-foreground  mb-3">{reply.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {reply.author && <span>{reply.author}</span>}
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
            )}

            <div className="grid gap-4 mb-6">
              {thread.product_areas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Product Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {thread.product_areas
                      .filter((area: string) => area !== 'Other')
                      .map((area: string) => (
                        <Badge key={area} variant="default">
                          {area}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {thread.stack.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {thread.stack
                      .filter((tech: string) => tech !== 'Other')
                      .map((tech: string) => (
                        <Badge key={tech} variant="default">
                          {tech}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-border">
              <Button asChild type="default" className="w-full sm:w-auto">
                <a href={thread.external_activity_url} target="_blank" rel="noopener noreferrer">
                  View on{' '}
                  {thread.channel === 'discord'
                    ? 'Discord'
                    : thread.channel === 'reddit'
                      ? 'Reddit'
                      : 'GitHub'}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </DefaultLayout>
  )
}
