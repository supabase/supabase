import { notFound } from 'next/navigation'
import { Badge, Button } from 'ui'
import { getThreadById } from '~/data/contribute'
import { DiscordIcon, GitHubIcon, RedditIcon } from '~/components/Contribute/Icons'
import { Conversation } from '~/components/Contribute/Conversation'
import { Suspense } from 'react'
import Loading from '../../app/contribute/t/[id]/loading'

export async function ThreadContent({ id }: { id: string }) {
  const thread = await getThreadById(id)

  if (!thread) {
    notFound()
  }

  return (
    <div className="border border-border rounded-lg p-8 bg-surface-200">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            {thread.channel === 'discord' && <DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
            {thread.channel === 'reddit' && <RedditIcon className="h-5 w-5 text-[#FF4500]" />}
            {thread.channel === 'github' && <GitHubIcon className="h-5 w-5 text-foreground" />}
            <span className="text-sm text-foreground-lighter capitalize">{thread.channel}</span>
            <span className="text-sm text-foreground-lighter">•</span>
            <span className="text-sm text-foreground-lighter">{thread.posted}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">{thread.title}</h1>
          <p className="text-sm text-foreground-lighter">by {thread.user}</p>
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <Conversation thread_key={thread.thread_key} />
      </Suspense>

      <div className="grid gap-4 mb-6">
        {thread.product_areas.filter((area: string) => area !== 'Other').length > 0 && (
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

        {thread.stack.filter((tech: string) => tech !== 'Other').length > 0 && (
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
            Help on{' '}
            {thread.channel === 'discord'
              ? 'Discord'
              : thread.channel === 'reddit'
                ? 'Reddit'
                : 'GitHub'}
          </a>
        </Button>
      </div>
    </div>
  )
}
