import { getThreadRepliesById } from '~/data/contribute'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function Conversation({ thread_key }: { thread_key: string | null }) {
  await sleep(5000)
  const { question, replies } = await getThreadRepliesById(thread_key)

  if (!question && replies.length === 0) {
    return null
  }

  return (
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
                <div key={reply.id} className="border border-border rounded-lg p-4 bg-surface-100">
                  <p className="text-foreground mb-3">{reply.content}</p>
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
  )
}
