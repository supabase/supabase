import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Send } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { EdgeFunctionTesterSheet } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import APIDocsButton from 'components/ui/APIDocsButton'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { Button } from 'ui'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import EdgeFunctionsLayout from './EdgeFunctionsLayout'

interface EdgeFunctionDetailsLayoutProps {
  title?: string
}

const EdgeFunctionDetailsLayout = ({
  title,
  children,
}: PropsWithChildren<EdgeFunctionDetailsLayoutProps>) => {
  const router = useRouter()
  const { functionSlug, ref } = useParams()
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const canReadFunctions = useCheckPermissions(PermissionAction.FUNCTIONS_READ, '*')

  const [isOpen, setIsOpen] = useState(false)

  const {
    data: selectedFunction,
    error,
    isError,
  } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  const name = selectedFunction?.name || ''

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

  return (
    <EdgeFunctionsLayout>
      <PageLayout
        isCompact
        size="full"
        title={functionSlug ? name : 'Edge Functions'}
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
            {edgeFunctionCreate && !!functionSlug && (
              <Button type="default" icon={<Send />} onClick={() => setIsOpen(true)}>
                Test
              </Button>
            )}
          </div>
        }
      >
        {children}
        <EdgeFunctionTesterSheet visible={isOpen} onClose={() => setIsOpen(false)} />
      </PageLayout>
    </EdgeFunctionsLayout>
  )
}

export default withAuth(EdgeFunctionDetailsLayout)
