import { useParams } from 'common'
import { Code, Play, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Separator,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { EDGE_FUNCTION_TEMPLATES } from './Functions.templates'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ScaffoldSectionTitle } from '@/components/layouts/Scaffold'
import { DocsButton } from '@/components/ui/DocsButton'
import { ResourceItem } from '@/components/ui/Resource/ResourceItem'
import { ResourceList } from '@/components/ui/Resource/ResourceList'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const track = useTrack()
  const [, setCreateMethod] = useQueryState('create', parseAsString)

  const showStripeExample = useIsFeatureEnabled('edge_functions:show_stripe_example')
  const templates = useMemo(() => {
    if (showStripeExample) {
      return EDGE_FUNCTION_TEMPLATES
    }

    // Filter out Stripe template
    return EDGE_FUNCTION_TEMPLATES.filter((template) => template.value !== 'stripe-webhook')
  }, [showStripeExample])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Deploy your first edge function</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* Editor Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Code strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">Via Editor</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Create and edit functions directly in the browser. Download to local at any time.
            </p>
            <Button
              type="default"
              onClick={() => {
                router.push(`/project/${ref}/functions/new`)
                track('edge_function_via_editor_button_clicked', { origin: 'no_functions_block' })
              }}
            >
              Open Editor
            </Button>
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
              onClick={() => {
                openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                aiSnap.newChat({
                  name: 'Create new edge function',
                  initialInput: 'Create a new edge function that ...',
                  suggestions: {
                    title:
                      'I can help you create a new edge function. Here are a few example prompts to get you started:',
                    prompts: [
                      {
                        label: 'Stripe Payments',
                        description:
                          'Create a new edge function that processes payments with Stripe',
                      },
                      {
                        label: 'Email with Resend',
                        description: 'Create a new edge function that sends emails with Resend',
                      },
                      {
                        label: 'PDF Generator',
                        description:
                          'Create a new edge function that generates PDFs from HTML templates',
                      },
                    ],
                  },
                })
                track('edge_function_ai_assistant_button_clicked', { origin: 'no_functions_block' })
              }}
            >
              Open Assistant
            </Button>
          </div>

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

            <Button
              type="default"
              onClick={() => {
                setCreateMethod('cli')
                track('edge_function_via_cli_button_clicked', { origin: 'no_functions_block' })
              }}
            >
              View CLI Instructions
            </Button>
          </div>
        </CardContent>
      </Card>
      <ScaffoldSectionTitle className="text-xl mb-4 mt-12">
        Start with a template
      </ScaffoldSectionTitle>
      <ResourceList>
        {templates.map((template) => (
          <ResourceItem
            key={template.name}
            media={<Code strokeWidth={1.5} size={16} className="translate-y-[-9px]" />}
            onClick={() => {
              track('edge_function_template_clicked', {
                templateName: template.name,
                origin: 'functions_page',
              })
            }}
          >
            <Link href={`/project/${ref}/functions/new?template=${template.value}`}>
              <p>{template.name}</p>
              <p className="text-sm text-foreground-lighter">{template.description}</p>
            </Link>
          </ResourceItem>
        ))}
      </ResourceList>
    </>
  )
}

export const FunctionsInstructionsLocal = () => {
  const showStripeExample = useIsFeatureEnabled('edge_functions:show_stripe_example')
  const templates = useMemo(() => {
    if (showStripeExample) {
      return EDGE_FUNCTION_TEMPLATES
    }

    // Filter out Stripe template
    return EDGE_FUNCTION_TEMPLATES.filter((template) => template.value !== 'stripe-webhook')
  }, [showStripeExample])

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Developing Edge Functions with the CLI</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              'p-0 flex flex-col',
              '2xl:grid 2xl:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] 2xl:divide-y-0 2xl:divide-x',
              'divide-y divide-default items-stretch'
            )}
          >
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Code size={20} />
                <h4 className="text-base text-foreground">Create an Edge Function</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 prose [&>code]:text-xs text-sm max-w-full">
                Create a new edge function called <code>hello-world</code> in your project via the
                Supabase CLI.
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value="supabase functions new hello-world"
                />
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/functions/local-quickstart#create-an-edge-function`}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2">
                <Play size={20} />
                <h4 className="text-base text-foreground">Run Edge Functions</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 prose [&>code]:text-xs text-sm max-w-full">
                You can run your Edge Function locally using <code>supabase functions serve</code>.
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value={`
supabase start # start the supabase stack
supabase functions serve # start the Functions watcher`.trim()}
                />
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/functions/local-quickstart#running-edge-functions-locally`}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2">
                <Terminal strokeWidth={1.5} size={20} />
                <h4 className="text-base text-foreground">Invoke Edge Functions</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4">
                While serving your local Edge Functions, you can invoke it using cURL or one of the
                client libraries.
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value={`
curl --request POST 'http://localhost:54321/functions/v1/hello-world' \\
  --header 'Authorization: Bearer SUPABASE_ANON_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{ "name":"Functions" }'`.trim()}
                />
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/functions/local-quickstart#invoking-edge-functions-locally`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Self-hosted Supabase</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
            <div className="p-8">
              <p className="text-sm text-foreground-light mt-1 mb-4">
                Edge Functions are available in self-hosted Supabase via Supabase Edge Runtime.
                Unlike the platform, functions must be added manually — place each function at{' '}
                <code className="text-code-inline">
                  volumes/functions/&lt;function-name&gt;/index.ts
                </code>{' '}
                and restart the <code className="text-code-inline">functions</code> service to pick
                up changes. See the guide to learn more about configuration, secrets, and routing.
              </p>
              <DocsButton href={`${DOCS_URL}/guides/self-hosting/self-hosted-functions`} />
            </div>
          </CardContent>
        </Card>

        <ScaffoldSectionTitle className="text-xl mt-12">Explore our templates</ScaffoldSectionTitle>
        <ResourceList>
          {templates.map((template) => (
            <Dialog key={template.name}>
              <DialogTrigger asChild>
                <ResourceItem
                  key={template.name}
                  media={<Code strokeWidth={1.5} size={16} className="translate-y-[-9px]" />}
                >
                  <div>
                    <p>{template.name}</p>
                    <p className="text-sm text-foreground-lighter">{template.description}</p>
                  </div>
                </ResourceItem>
              </DialogTrigger>
              <DialogContent size="large">
                <DialogHeader>
                  <DialogTitle>{template.name}</DialogTitle>
                  <DialogDescription>{template.description}</DialogDescription>
                </DialogHeader>
                <Separator />
                <DialogSection className="p-0!">
                  <CodeBlock
                    language="ts"
                    hideLineNumbers={true}
                    className={cn(
                      'border-0 rounded-none px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 max-h-[420px]'
                    )}
                    value={template.content}
                  />
                </DialogSection>
              </DialogContent>
            </Dialog>
          ))}
        </ResourceList>
      </div>
    </>
  )
}

export const FunctionsSecretsEmptyStateLocal = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Local development & CLI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-foreground-light mb-4">
            <p className="mb-2">Secrets can be loaded in two ways:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Place a <code className="text-code-inline">.env</code> file at{' '}
                <code className="text-code-inline">supabase/functions/.env</code> — picked up
                automatically on <code className="text-code-inline">supabase start</code>.
              </li>
              <li>
                Pass <code className="text-code-inline">--env-file</code> to{' '}
                <code className="text-code-inline">supabase functions serve</code>, e.g.{' '}
                <code className="text-code-inline">
                  supabase functions serve --env-file ./path/to/.env-file
                </code>
              </li>
            </ul>
          </div>
          <DocsButton href={`${DOCS_URL}/guides/functions/secrets#using-the-cli`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Self-Hosted Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-light mb-4">
            Configure secrets in your <code className="text-code-inline">.env</code> file and{' '}
            <code className="text-code-inline">docker-compose.yml</code> under the{' '}
            <code className="text-code-inline">functions</code> service.
          </p>
          <DocsButton
            href={`${DOCS_URL}/guides/self-hosting/self-hosted-functions#custom-environment-variables`}
          />
        </CardContent>
      </Card>
    </>
  )
}
