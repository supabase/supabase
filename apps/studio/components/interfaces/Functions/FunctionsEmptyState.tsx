import { useParams } from 'common'
import { Code, Server, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { AiIconAnimation, Button, Card, CardContent, CardHeader, CardTitle } from 'ui'

import { EDGE_FUNCTION_TEMPLATES } from './Functions.templates'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ScaffoldSectionTitle } from '@/components/layouts/Scaffold'
import { DocsButton } from '@/components/ui/DocsButton'
import { ResourceItem } from '@/components/ui/Resource/ResourceItem'
import { ResourceList } from '@/components/ui/Resource/ResourceList'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { isCli, isSelfHosted } = useDeploymentMode()
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

  const emptyStateTitle = IS_PLATFORM
    ? 'Deploy your first edge function'
    : 'Add your first edge function'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{emptyStateTitle}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* Editor Option */}
          {IS_PLATFORM && (
            <>
              <div className="p-8">
                <div className="flex items-center gap-2">
                  <Code strokeWidth={1.5} size={20} />
                  <h4 className="text-base text-foreground">Via Editor</h4>
                </div>
                <p className="text-sm text-foreground-light mb-4 mt-1">
                  Create and edit functions directly in the browser. Download to local at any time.
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    router.push(`/project/${ref}/functions/new`)
                    track('edge_function_via_editor_button_clicked', {
                      origin: 'no_functions_block',
                    })
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
                  Let our AI assistant help you create functions. Perfect for kickstarting a
                  function.
                </p>
                <Button
                  variant="default"
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
                    track('edge_function_ai_assistant_button_clicked', {
                      origin: 'no_functions_block',
                    })
                  }}
                >
                  Open Assistant
                </Button>
              </div>
            </>
          )}

          {/* CLI Option */}
          {(IS_PLATFORM || isCli) && (
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
                variant="default"
                onClick={() => {
                  setCreateMethod('cli')
                  track('edge_function_via_cli_button_clicked', { origin: 'no_functions_block' })
                }}
              >
                View CLI Instructions
              </Button>
            </div>
          )}

          {isSelfHosted && <SelfHostedManualFunctionContent />}
        </CardContent>
      </Card>
      {IS_PLATFORM && (
        <>
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
      )}
    </>
  )
}

const SelfHostedManualFunctionContent = () => (
  <div className="p-8">
    <div className="flex items-center gap-2">
      <Server strokeWidth={1.5} size={20} />
      <h4 className="text-base text-foreground">Self-Hosted</h4>
    </div>
    <p className="text-sm text-foreground-light mb-4 mt-1">
      Place each function at{' '}
      <code className="text-code-inline">volumes/functions/&lt;function-name&gt;/index.ts</code> and
      restart the <code className="text-code-inline">functions</code> service to pick up changes.
    </p>
    <DocsButton href={`${DOCS_URL}/guides/self-hosting/self-hosted-functions`} />
  </div>
)
