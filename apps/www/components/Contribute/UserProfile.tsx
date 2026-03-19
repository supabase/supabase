import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Button } from 'ui'
import { DiscordIcon, GitHubIcon, RedditIcon } from '~/components/Contribute/Icons'
import { getUserActivity } from '~/data/contribute'
import type { ThreadRow } from '~/types/contribute'

function ThreadCard({ thread }: { thread: ThreadRow }) {
  return (
    <Link
      href={`/contribute/t/${thread.id}`}
      className="border border-border rounded-lg p-4 bg-surface-75 hover:bg-surface-100 transition-colors min-w-0"
    >
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {thread.channel === 'discord' && <DiscordIcon className="h-4 w-4 text-[#5865F2]" />}
          {thread.channel === 'reddit' && <RedditIcon className="h-4 w-4 text-[#FF4500]" />}
          {thread.channel === 'github' && <GitHubIcon className="h-4 w-4 text-foreground" />}
          <span>{thread.channelDisplayName}</span>
          <span>•</span>
          <span>{thread.posted}</span>
        </div>
        <h3 className="text-foreground font-medium">{thread.title}</h3>
        {thread.summary && (
          <p className="text-sm text-foreground-light line-clamp-2">{thread.summary}</p>
        )}
        {thread.product_areas.filter((area) => area !== 'Other').length > 0 && (
          <div className="flex flex-wrap gap-1">
            {thread.product_areas
              .filter((area) => area !== 'Other')
              .slice(0, 3)
              .map((area) => (
                <Badge key={area} variant="default">
                  {area}
                </Badge>
              ))}
            {thread.product_areas.filter((area) => area !== 'Other').length > 3 && (
              <Badge variant="default">
                +{thread.product_areas.filter((area) => area !== 'Other').length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

interface Reply {
  id: string
  author: string | null
  content: string | null
  ts: string | null
  external_activity_url: string | null
  thread_key: string | null
}

function ReplyCard({ reply, thread }: { reply: Reply; thread?: ThreadRow }) {
  const platformName = thread?.channelDisplayName ?? 'platform'

  return (
    <div className="border border-border rounded-lg p-4 bg-surface-75 min-w-0">
      <div className="grid gap-2">
        {thread && (
          <Link
            href={`/contribute/t/${thread.id}`}
            className="text-foreground-light text-sm hover:text-foreground transition-colors"
          >
            <span className="font-medium">Reply to:</span> {thread.title}
          </Link>
        )}
        <p className="text-foreground text-sm line-clamp-3">{reply.content}</p>
        <div className="flex items-center justify-between gap-2">
          {reply.ts && (
            <span className="text-xs text-muted-foreground">
              {new Date(reply.ts).toLocaleString()}
            </span>
          )}
          {reply.external_activity_url && (
            <Button asChild type="default" size="tiny">
              <a
                href={reply.external_activity_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                View on {platformName}
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export async function UserProfile({ username }: { username: string }) {
  const { threads, replies, replyThreads, stats } = await getUserActivity(username)

  if (threads.length === 0 && replies.length === 0) {
    notFound()
  }

  return (
    <div className="border border-border rounded-lg p-8 bg-surface-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-foreground mb-2">{username}</h1>
        <div className="flex items-center gap-3 text-foreground-light">
          <div className="flex items-center gap-2">
            <span>{stats.threadCount}</span>
            <span>{stats.threadCount === 1 ? 'thread' : 'threads'}</span>
          </div>
          <span>/</span>
          <div className="flex items-center gap-2">
            <span>{stats.replyCount}</span>
            <span>{stats.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        </div>
      </div>

      {/* Threads Section */}
      {threads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl text-foreground mb-4">Threads created</h2>
          <div className="grid gap-3">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        </div>
      )}

      {/* Replies Section */}
      {replies.length > 0 && (
        <div>
          <h2 className="text-xl text-foreground mb-4">Recent replies</h2>
          <div className="grid gap-3">
            {replies.map((reply) => {
              const thread = replyThreads.find((t) => t.thread_key === reply.thread_key)
              return <ReplyCard key={reply.id} reply={reply} thread={thread} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}
