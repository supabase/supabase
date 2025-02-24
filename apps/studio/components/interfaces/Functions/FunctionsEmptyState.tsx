import { Terminal, Code } from 'lucide-react'
import { useParams } from 'common'
import { EDGE_FUNCTION_TEMPLATES } from './Functions.templates'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DialogSection,
  DialogContent,
  Dialog,
  DialogTrigger,
} from 'ui'
import TerminalInstructions from './TerminalInstructions'
import { useAppStateSnapshot } from 'state/app-state'
import { useRouter } from 'next/router'
import { AiIconAnimation } from 'ui'
import { ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'

const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { setAiAssistantPanel } = useAppStateSnapshot()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create your first edge function</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
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
              Let our AI assistant help you create functions. Perfect for quick prototypes and
              learning.
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
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Code strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">Via Editor</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Create and edit functions directly in the browser. Great for quick edits and testing.
            </p>
            <Button type="default" onClick={() => router.push(`/project/${ref}/functions/new`)}>
              Open Editor
            </Button>
          </div>
        </CardContent>
      </Card>
      <ScaffoldSectionTitle className="text-xl mb-4 mt-12">Examples</ScaffoldSectionTitle>
      <ResourceList>
        {EDGE_FUNCTION_TEMPLATES.map((template) => (
          <ResourceItem
            key={template.title}
            media={<Code strokeWidth={1.5} size={16} />}
            onClick={() => {
              localStorage.setItem(
                'edgefunction_example',
                JSON.stringify({
                  code: template.code,
                  slug: template.slug,
                })
              )
              router.push(`/project/${ref}/functions/new`)
            }}
          >
            {template.title}
          </ResourceItem>
        ))}
      </ResourceList>
    </>
  )
}

export default FunctionsEmptyState
