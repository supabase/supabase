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
import EdgeFunctionTesterSheet from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet'
import { useFlag } from 'hooks/ui/useFlag'

interface FunctionsLayoutProps {
  title?: string
}

const TestPopover = ({ url, apiKey }: { url: string; apiKey: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button type="default" size="tiny" icon={<Send size={16} />} onClick={() => setIsOpen(true)}>
        Test
      </Button>
      <EdgeFunctionTesterSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        url={url}
        apiKey={apiKey}
      />
    </>
  )
}

const FunctionsLayout = ({ title, children }: PropsWithChildren<FunctionsLayoutProps>) => {
  const router = useRouter()
  const { functionSlug, ref } = useParams()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')

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
          label: 'Code',
          href: `/project/${ref}/functions/${functionSlug}/code`,
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
        isCompact
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
            {functionSlug && edgeFunctionCreate && (
              <>
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
