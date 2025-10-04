import { AiIconAnimation, Button, Card, cn } from 'ui'
import Link from 'next/link'
import { AnimatedCursors } from './AnimatedCursors'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'

/**
 * Acts as a container component for the entire log display
 */
export const EmptyRealtime = ({ projectRef }: { projectRef: string }) => {
  const aiSnap = useAiAssistantStateSnapshot()

  const handleCreateTriggerWithAssistant = () => {
    aiSnap.newChat({
      name: `Realtime`,
      open: true,
      initialInput: `Help me set up a realtime experience for my project`,
    })
  }

  return (
    <div className="flex grow items-center justify-center p-12 border-t @container">
      <div className="w-full max-w-4xl flex flex-col items-center gap-0">
        <div className="text-center mb-12">
          <AnimatedCursors />
          <h2 className="heading-section mb-1">Create realtime experiences</h2>
          <p className="text-foreground-light mb-6">
            Send your first realtime message from your database, application code or edge function
          </p>
          <Button
            type="default"
            icon={<AiIconAnimation />}
            onClick={handleCreateTriggerWithAssistant}
          >
            Set up realtime for me
          </Button>
        </div>

        <Card className="grid grid-cols-1 @xl:grid-cols-3 bg divide-x mb-8">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                )}
              >
                1
              </span>
              <h3 className="heading-default">Broadcast messages</h3>
            </div>
            <p className="text-foreground-light text-sm mb-4 flex-1">
              Send messages to a channel from your client application or database via triggers.
            </p>
            <Button type="default" className="w-full">
              <Link href={`/project/${projectRef}/database/triggers`}>Create a trigger</Link>
            </Button>
          </div>

          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                )}
              >
                2
              </span>
              <h3 className="heading-default">Write policies</h3>
            </div>
            <p className="text-foreground-light text-sm mb-4 flex-1">
              Set up Row Level Security policies to control who can see messages within a channel
            </p>
            <Button type="default">
              <Link href={`/project/${projectRef}/realtime/policies`}>Write a policy</Link>
            </Button>
          </div>

          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                )}
              >
                3
              </span>
              <h3 className="heading-default">Subscribe to a channel</h3>
            </div>
            <p className="text-foreground-light text-sm mb-4 flex-1">
              Receive realtime messages in your application by listening to a channel
            </p>
            <Button type="default" asChild>
              <Link href="https://supabase.com/docs/guides/realtime/subscribing-to-database-changes#listening-on-client-side">
                Read the guide
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
