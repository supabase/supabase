import { useParams } from 'common'
import { ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { useFlag } from 'hooks/ui/useFlag'
import { Code, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogSection,
  DialogTrigger,
} from 'ui'
import { EDGE_FUNCTION_TEMPLATES } from './Functions.templates'
import { TerminalInstructions } from './TerminalInstructions'

export const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { setAiAssistantPanel } = useAppStateSnapshot()
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create your first edge function</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* CLI Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Terminal strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">Via CLI</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Create and deploy functions using the Supabase CLI. Ideal for local development and
              version control.
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button type="default">View CLI Instructions</Button>
              </DialogTrigger>
              <DialogContent size="large">
                <DialogSection padding="small">
                  <TerminalInstructions />
                </DialogSection>
              </DialogContent>
            </Dialog>
          </div>

          {/* AI Assistant Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <AiIconAnimation size={20} />
              <h4 className="text-base text-foreground">AI Assistant</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Let our AI assistant help you create functions. Perfect for kickstarting a function.
            </p>
            <Button
              type="default"
              onClick={() =>
                setAiAssistantPanel({
                  open: true,
                  initialInput: 'Create a new edge function that ...',
                  suggestions: {
                    title:
                      'I can help you create a new edge function. Here are a few example prompts to get you started:',
                    prompts: [
                      'Create a new edge function that processes payments with Stripe',
                      'Create a new edge function that sends emails with Resend',
                      'Create a new edge function that generates PDFs from HTML templates',
                    ],
                  },
                })
              }
            >
              Open Assistant
            </Button>
          </div>

          {/* Editor Option */}
          {edgeFunctionCreate && (
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Code strokeWidth={1.5} size={20} />
                <h4 className="text-base text-foreground">Via Editor</h4>
              </div>
              <p className="text-sm text-foreground-light mb-4 mt-1">
                Create and edit functions directly in the browser. Download to local at any time.
              </p>
              <Button type="default" onClick={() => router.push(`/project/${ref}/functions/new`)}>
                Open Editor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {edgeFunctionCreate && (
        <>
          <ScaffoldSectionTitle className="text-xl mb-4 mt-12">
            Start with a template
          </ScaffoldSectionTitle>
          <ResourceList>
            {EDGE_FUNCTION_TEMPLATES.map((template) => (
              <ResourceItem
                key={template.name}
                media={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
                onClick={() => {}}
              >
                <Link href={`/project/${ref}/functions/new?template=${template.value}`}>
                  <p>{template.name}</p>
                  <p className="text-sm text-foreground-lighter">{template.description}</p>
                </Link>
              </ResourceItem>
            ))}
          </ResourceList>
        </>
      )}
    </>
  )
}
