import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, FileArchive, Send } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { EdgeFunctionTesterSheet } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import APIDocsButton from 'components/ui/APIDocsButton'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Separator,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
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
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const { isLoading, can: canReadFunctions } = useAsyncCheckProjectPermissions(
    PermissionAction.FUNCTIONS_READ,
    '*'
  )

  const [isOpen, setIsOpen] = useState(false)

  const {
    data: selectedFunction,
    error,
    isError,
  } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })

  const { data: functionFiles = [], error: filesError } = useEdgeFunctionBodyQuery(
    {
      projectRef: ref,
      slug: functionSlug,
    },
    {
      retry: false,
      retryOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
    }
  )

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
          label: 'Code',
          href: `/project/${ref}/functions/${functionSlug}/code`,
        },
        {
          label: 'Details',
          href: `/project/${ref}/functions/${functionSlug}/details`,
        },
      ]
    : []

  const downloadFunction = async () => {
    if (filesError) return toast.error('Failed to retrieve edge function files')

    const zipFileWriter = new BlobWriter('application/zip')
    const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true })
    functionFiles.forEach((file) => {
      const nameSections = file.name.split('/')
      const slugIndex = nameSections.indexOf(functionSlug ?? '')
      const fileName = nameSections.slice(slugIndex + 1).join('/')

      const fileBlob = new Blob([file.content])
      zipWriter.add(fileName, new BlobReader(fileBlob))
    })

    const blobURL = URL.createObjectURL(await zipWriter.close())
    const link = document.createElement('a')
    link.href = blobURL
    link.setAttribute('download', `${functionSlug}.zip`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

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

  if (!isLoading && !canReadFunctions) {
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
            <Popover_Shadcn_>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="default" icon={<Download />}>
                  Download
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ align="end" className="p-0">
                <div className="p-3 flex flex-col gap-y-2">
                  <p className="text-xs text-foreground-light">Download via CLI</p>
                  <Input
                    copy
                    showCopyOnHover
                    readOnly
                    containerClassName=""
                    className="text-xs font-mono tracking-tighter"
                    value={`supabase functions download ${functionSlug}`}
                  />
                </div>
                <Separator className="!bg-border-overlay" />
                <div className="py-2 px-1">
                  <Button
                    type="text"
                    className="w-min hover:bg-transparent"
                    icon={<FileArchive />}
                    onClick={downloadFunction}
                  >
                    Download as ZIP
                  </Button>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
            {!!functionSlug && (
              <Button
                type="default"
                icon={<Send />}
                onClick={() => {
                  setIsOpen(true)
                  sendEvent({
                    action: 'edge_function_test_side_panel_opened',
                    groups: {
                      project: ref ?? 'Unknown',
                      organization: org?.slug ?? 'Unknown',
                    },
                  })
                }}
              >
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
