import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, type PropsWithChildren, useState } from 'react'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import APIDocsButton from 'components/ui/APIDocsButton'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import EdgeFunctionsLayout from '../EdgeFunctionsLayout/EdgeFunctionsLayout'
import { useFlag } from 'hooks/ui/useFlag'

interface FunctionsLayoutProps {
  title?: string
}

const FunctionsLayout = ({ title, children }: PropsWithChildren<FunctionsLayoutProps>) => {
  const router = useRouter()
  const { functionSlug, ref } = useParams()
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const {
    data: selectedFunction,
    error,
    isError,
  } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })

  const canReadFunctions = useCheckPermissions(PermissionAction.FUNCTIONS_READ, '*')

  const name = selectedFunction?.name || ''

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

  if (edgeFunctionCreate) {
    navigationItems.splice(navigationItems.length - 1, 0, {
      label: 'Code',
      href: `/project/${ref}/functions/${functionSlug}/code`,
    })
  }

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
          </div>
        }
      >
        {children}
      </PageLayout>
    </EdgeFunctionsLayout>
  )
}

export default withAuth(FunctionsLayout)
