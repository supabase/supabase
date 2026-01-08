import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from 'ui'
import { Conversation } from '~/components/Contribute/Conversation'
import { HelpOnPlatformButton } from '~/components/Contribute/HelpOnPlatformButton'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 pb-6 border-b border-border">
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
        {/* CTA Button */}
        <div>
          <HelpOnPlatformButton
            channel={thread.channel}
            externalActivityUrl={thread.external_activity_url}
          />
        </div>
      </div>
    </div>
  )
}
