import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from 'ui'
import { Conversation } from '~/components/Contribute/Conversation'
import { HelpOnPlatformButton } from '~/components/Contribute/HelpOnPlatformButton'
import { getThreadById, getRelatedThreads } from '~/data/contribute'
import Loading from '../../app/contribute/t/[id]/loading'
import Link from 'next/link'

export async function ThreadContent({ id }: { id: string }) {
  const thread = await getThreadById(id)

  if (!thread) {
    notFound()
  }

  const relatedThreads = await getRelatedThreads(id)

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

      {/* Related Threads Section */}
      {relatedThreads.length > 0 && (
        <div className="border border-border rounded-lg p-6 bg-surface-200">
          <h3 className="text-lg font-medium text-foreground mb-4">Related threads</h3>
          <div className="space-y-3">
            {relatedThreads.map((relatedThread) => (
              <Link
                key={relatedThread.id}
                href={`/contribute/t/${relatedThread.id}`}
                className="block p-4 border border-border rounded-lg hover:bg-surface-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {relatedThread.title}
                      </h4>
                      <Badge variant="outline" size="small">
                        {(relatedThread.similarityScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    {relatedThread.summary && (
                      <p className="text-xs text-foreground-light line-clamp-2">
                        {relatedThread.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" size="small">
                        {relatedThread.channel}
                      </Badge>
                      {relatedThread.product_areas
                        .filter((area: string) => area !== 'Other')
                        .slice(0, 2)
                        .map((area: string) => (
                          <Badge key={area} variant="default" size="small">
                            {area}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="text-xs text-foreground-light whitespace-nowrap">
                    {relatedThread.posted}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
