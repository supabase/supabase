import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Badge, Button } from 'ui'
import { Conversation } from '~/components/Contribute/Conversation'
import { getThreadById } from '~/data/contribute'
import Loading from '../../app/contribute/t/[id]/loading'

export async function ThreadContent({ id }: { id: string }) {
  const thread = await getThreadById(id)

  if (!thread) {
    notFound()
  }

  return (
    <div className="grid gap-6">
      {/* Conversation Section (includes title, question, and first reply) */}
      <Suspense fallback={<Loading />}>
        <Conversation thread={thread} />
      </Suspense>

      {/* Metadata and Actions Section */}
      <div className="border border-border rounded-lg p-6 bg-surface-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {thread.product_areas.filter((area: string) => area !== 'Other').length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Product areas</h3>
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
              <h3 className="text-sm font-medium text-foreground mb-2">Stack</h3>
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
    </div>
  )
}
