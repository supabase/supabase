import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, type PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import APIDocsButton from 'components/ui/APIDocsButton'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { Code } from 'lucide-react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { Button, cn } from 'ui'
import FunctionsNav from '../../interfaces/Functions/FunctionsNav'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

interface FunctionsLayoutProps {
  title?: string
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

  const canReadFunctions = useCheckPermissions(PermissionAction.FUNCTIONS_READ, '*')

  const name = selectedFunction?.name || ''
  const hasFunctions = (functions ?? []).length > 0
  const centered = !hasFunctions

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
    <ProjectLayout isLoading={isLoading} title={title || 'Edge Functions'} product="Edge Functions">
      {centered ? (
        <>
          <div className="mx-auto max-w-full md:max-w-5xl py-12 md:py-20 px-4 md:px-5">
            <div
              className="item-center
            flex
            flex-col
            justify-between
            gap-y-4
            xl:flex-row"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl text-foreground">Edge Functions</h1>
                </div>
              </div>
            </div>

            {children}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-grow flex-col py-6">
          <div
            className={cn(
              'mx-auto flex w-full flex-col transition-all',
              '1xl:px-28 gap-4 px-5 lg:px-16 xl:px-24 2xl:px-32'
            )}
          >
            <div className="item-center flex flex-col justify-between gap-y-4 xl:flex-row">
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    'h-6 w-6 rounded border border-brand-600 bg-brand-300',
                    'flex items-center justify-center text-brand'
                  )}
                >
                  <Code size={14} strokeWidth={3} />
                </div>

                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <Link href={`/project/${ref}/functions`}>
                      <h1 className="cursor-pointer text-2xl text-foreground transition-colors hover:text-foreground-light">
                        Edge Functions
                      </h1>
                    </Link>
                    {name && (
                      <div className="flex items-center space-x-4">
                        <span className="text-foreground-light">
                          <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            shapeRendering="geometricPrecision"
                          >
                            <path d="M16 3.549L7.12 20.600"></path>
                          </svg>
                        </span>
                        <h1 className="text-2xl text-foreground">{name}</h1>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button asChild type="default">
                      <Link href={`/project/${ref}/settings/functions`}>Manage secrets</Link>
                    </Button>
                    {isNewAPIDocsEnabled && (
                      <APIDocsButton
                        section={
                          functionSlug !== undefined
                            ? ['edge-functions', functionSlug]
                            : ['edge-functions']
                        }
                      />
                    )}
                    <DocsButton href="https://supabase.com/docs/guides/functions" />
                  </div>
                </div>
              </div>
            </div>
            {functionSlug !== undefined && <FunctionsNav item={selectedFunction} />}
          </div>
          <div
            className={[
              'mx-auto flex h-full w-full flex-grow flex-col transition-all',
              '1xl:px-28 gap-4 px-5 lg:px-16 xl:px-24 2xl:px-32',
            ].join(' ')}
          >
            {children}
          </div>
        </div>
      )}
    </ProjectLayout>
  )
}

export default withAuth(FunctionsLayout)
