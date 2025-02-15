import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, type PropsWithChildren, useState } from 'react'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import APIDocsButton from 'components/ui/APIDocsButton'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { Code, Code2, Play, Send, Terminal, TestTubeDiagonal } from 'lucide-react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { Button, cn, CodeBlock } from 'ui'
import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import FunctionsNav from '../../interfaces/Functions/FunctionsNav'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { PageLayout } from 'components/layouts/PageLayout'
import EdgeFunctionsLayout from '../EdgeFunctionsLayout/EdgeFunctionsLayout'
import EdgeFunctionTester from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTester'

interface FunctionsLayoutProps {
  title?: string
}

const InvokePopover = ({
  functionName,
  url,
  apiKey,
}: {
  functionName: string
  url: string
  apiKey: string
}) => {
  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<Terminal size={16} />}>
          Invoke
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="end" className="w-xl w-full max-w-[500px] space-y-4">
        <div>
          <h4 className="text-sm mb-2">Invoke via CLI</h4>
          <CodeBlock
            language="bash"
            className="text-xs !mt-0"
            value={`curl -L -X POST '${url}' \\
  -H 'Authorization: Bearer ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  --data '{"name":"Functions"}'`}
          />
        </div>
        <div>
          <h4 className="text-sm mb-2">Invoke via supabase-js</h4>
          <CodeBlock
            language="js"
            hideLineNumbers
            className="text-xs !mt-0 leading-3"
            value={`import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const { data, error } = await supabase.functions.invoke('${functionName}', {
  body: { name: 'Functions' },
})`}
          />
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

const TestPopover = ({ url, apiKey }: { url: string; apiKey: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" size="tiny" icon={<Send size={16} />}>
          Test
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[500px]" align="end">
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-4">Send test requests to your edge function</p>
            <EdgeFunctionTester url={url} anonKey={apiKey} />
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

const FunctionsLayout = ({ title, children }: PropsWithChildren<FunctionsLayoutProps>) => {
  const router = useRouter()
  const { functionSlug, ref } = useParams()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const { data: functions, isLoading } = useEdgeFunctionsQuery({ projectRef: ref })
  const {
    data: selectedFunction,
    error,
    isError,
  } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  const canReadFunctions = useCheckPermissions(PermissionAction.FUNCTIONS_READ, '*')

  const name = selectedFunction?.name || ''
  const hasFunctions = (functions ?? []).length > 0
  const { anonKey } = getAPIKeys(settings)
  const apiKey = anonKey?.api_key ?? '[YOUR ANON KEY]'
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const functionUrl = `${protocol}://${endpoint}/functions/v1/${functionSlug}`

  useEffect(() => {
    let cancel = false

    if (!!functionSlug && isError && error.code === 404 && !cancel) {
      toast('Edge function cannot be found in your project')
      router.push(`/project/${ref}/functions`)
    }

    return () => {
      cancel = true
    }
  }, [isError])

  if (!canReadFunctions) {
    return (
      <ProjectLayout title={title || 'Edge Functions'} product="Edge Functions">
        <NoPermission isFullPage resourceText="access your project's edge functions" />
      </ProjectLayout>
    )
  }

  const breadcrumbItems = [
    {
      label: 'Edge Functions',
      href: `/project/${ref}/functions`,
    },
  ]

  const navigationItems = functionSlug
    ? [
        {
          label: 'Overview',
          href: `/project/${ref}/functions/${functionSlug}`,
        },
        {
          label: 'Invocations',
          href: `/project/${ref}/functions/${functionSlug}/invocations`,
        },
        {
          label: 'Logs',
          href: `/project/${ref}/functions/${functionSlug}/logs`,
        },
        {
          label: 'Details',
          href: `/project/${ref}/functions/${functionSlug}/details`,
        },
      ]
    : []

  return (
    <EdgeFunctionsLayout>
      <PageLayout
        size="full"
        title={functionSlug ? name : 'Edge Functions'}
        subtitle={
          functionSlug
            ? `https://${ref}.functions.supabase.co/${functionSlug}`
            : 'Write and deploy code without having to manage servers'
        }
        breadcrumbs={breadcrumbItems}
        navigationItems={navigationItems}
        primaryActions={
          <div className="flex items-center space-x-2">
            {isNewAPIDocsEnabled && (
              <APIDocsButton
                section={
                  functionSlug !== undefined ? ['edge-functions', functionSlug] : ['edge-functions']
                }
              />
            )}
            <DocsButton href="https://supabase.com/docs/guides/functions" />
            {functionSlug && (
              <>
                <InvokePopover functionName={functionSlug} url={functionUrl} apiKey={apiKey} />
                <TestPopover url={functionUrl} apiKey={apiKey} />
              </>
            )}
          </div>
        }
      >
        {children}
      </PageLayout>
    </EdgeFunctionsLayout>
  )
}

export default withAuth(FunctionsLayout)
