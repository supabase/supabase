import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { IS_PLATFORM, useParams } from 'common'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Clock, Download, FileArchive, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState, type PropsWithChildren } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  NavMenu,
  NavMenuItem,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Separator,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { ProjectLayout } from '../ProjectLayout'
import EdgeFunctionsLayout from './EdgeFunctionsLayout'
import { EdgeFunctionTesterSheet } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet'
import CopyButton from '@/components/ui/CopyButton'
import { DocsButton } from '@/components/ui/DocsButton'
import NoPermission from '@/components/ui/NoPermission'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useEdgeFunctionBodyQuery } from '@/data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { withAuth } from '@/hooks/misc/withAuth'
import { DOCS_URL } from '@/lib/constants'

dayjs.extend(relativeTime)

interface EdgeFunctionDetailsLayoutProps {
  title: string
}

const EdgeFunctionDetailsLayout = ({
  title,
  children,
}: PropsWithChildren<EdgeFunctionDetailsLayoutProps>) => {
  const router = useRouter()
  const { data: org } = useSelectedOrganizationQuery()
  const { functionSlug, ref } = useParams()
  const { mutate: sendEvent } = useSendEventMutation()

  const { isLoading, can: canReadFunctions } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    '*'
  )

  const [isOpen, setIsOpen] = useState(false)
  const [isTimestampHoverCardOpen, setIsTimestampHoverCardOpen] = useState(false)

  const {
    data: selectedFunction,
    error,
    isError,
  } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const { data: endpoint } = useProjectApiUrl({ projectRef: ref })

  const { data: functionBody = { version: 0, files: [] }, error: filesError } =
    useEdgeFunctionBodyQuery(
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
  const functionUrl =
    endpoint && selectedFunction?.slug ? `${endpoint}/functions/v1/${selectedFunction.slug}` : ''
  const createdRelative = selectedFunction?.created_at
    ? dayjs(selectedFunction.created_at).fromNow()
    : undefined
  const updatedRelative = selectedFunction?.updated_at
    ? dayjs(selectedFunction.updated_at).fromNow()
    : undefined
  const browserTitle = {
    entity: functionSlug ? name || functionSlug : undefined,
    section: title,
  }

  const breadcrumbItems = [
    {
      label: 'Edge Functions',
      href: `/project/${ref}/functions`,
    },
    {
      label: functionSlug,
      href: `/project/${ref}/functions/${functionSlug}`,
    },
  ]

  const navigationItems = functionSlug
    ? [
        ...(IS_PLATFORM
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
            ]
          : []),
        {
          label: 'Code',
          href: `/project/${ref}/functions/${functionSlug}/code`,
        },
        {
          label: 'Settings',
          href: `/project/${ref}/functions/${functionSlug}/details`,
        },
      ]
    : []

  const downloadFunction = async () => {
    if (filesError) return toast.error('Failed to retrieve edge function files')

    const zipFileWriter = new BlobWriter('application/zip')
    const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true })

    // Extract file paths relative to function slug
    const filePaths = functionBody.files.map((file) => {
      const nameSections = file.name.split('/')
      const slugIndex = nameSections.indexOf(functionSlug ?? '')
      return nameSections.slice(slugIndex + 1).join('/')
    })

    // Find the deepest relative path (count leading ../ segments)
    let maxDepth = 0
    filePaths.forEach((path) => {
      const segments = path.split('/')
      let depth = 0
      for (const segment of segments) {
        if (segment === '..') {
          depth++
        } else {
          break
        }
      }
      maxDepth = Math.max(maxDepth, depth)
    })

    // Add files to zip with normalized paths
    functionBody.files.forEach((file) => {
      const nameSections = file.name.split('/')
      const slugIndex = nameSections.indexOf(functionSlug ?? '')
      const fileName = nameSections.slice(slugIndex + 1).join('/')

      // Count and remove leading ../ segments
      const segments = fileName.split('/')
      let parentDirCount = 0
      while (segments.length > 0 && segments[0] === '..') {
        segments.shift()
        parentDirCount++
      }

      // Calculate safe path:
      // - Files without ../ go into the full base path
      // - Files with ../ go into a shallower path based on how many levels up they go
      const depthFromBase = maxDepth - parentDirCount
      const safePath =
        depthFromBase > 0
          ? Array.from({ length: depthFromBase }, (_, i) => (i === 0 ? 'src' : `src${i}`)).join(
              '/'
            ) +
            '/' +
            segments.join('/')
          : segments.join('/')

      const fileBlob = new Blob([file.content])
      zipWriter.add(safePath, new BlobReader(fileBlob))
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
      <ProjectLayout product="Edge Functions" browserTitle={browserTitle}>
        <NoPermission isFullPage resourceText="access your project's edge functions" />
      </ProjectLayout>
    )
  }

  return (
    <EdgeFunctionsLayout title={title} browserTitle={browserTitle}>
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageHeader size="full" className="sticky top-0 z-10 bg-surface-75">
          {breadcrumbItems.length > 0 && (
            <PageHeaderBreadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={item.label || `breadcrumb-${index}`}>
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </PageHeaderBreadcrumb>
          )}

          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>{functionSlug ? name : 'Edge Functions'}</PageHeaderTitle>
              <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm!">
                <div className="flex items-center gap-x-2">
                  <span className="flex items-center gap-2">{functionUrl}</span>
                  <CopyButton iconOnly type="text" text={functionUrl} />
                </div>

                <HoverCard
                  openDelay={250}
                  closeDelay={100}
                  open={isTimestampHoverCardOpen}
                  onOpenChange={setIsTimestampHoverCardOpen}
                >
                  <HoverCardTrigger asChild>
                    <button type="button" className="flex items-center gap-2 group">
                      <Clock size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                      <span className="transition text-foreground-light group-hover:text-foreground underline decoration-dotted decoration-foreground-muted underline-offset-4">
                        {updatedRelative ?? 'Deploy status unavailable'}
                      </span>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="bottom" align="start" className="w-40 p-0">
                    {createdRelative && (
                      <div className="px-4 py-2 space-y-1">
                        <h3 className="heading-meta text-foreground-light">Created</h3>
                        {!!selectedFunction && (
                          <TimestampInfo
                            className="text-sm"
                            label={createdRelative}
                            utcTimestamp={selectedFunction.created_at}
                          />
                        )}
                      </div>
                    )}
                    {updatedRelative && (
                      <div className="px-4 py-2 space-y-1">
                        <h3 className="heading-meta text-foreground-light">Last deployed</h3>
                        {!!selectedFunction && (
                          <TimestampInfo
                            className="text-sm"
                            label={updatedRelative}
                            utcTimestamp={selectedFunction.updated_at}
                          />
                        )}
                      </div>
                    )}
                    {selectedFunction?.version !== undefined && (
                      <div className="px-4 py-2 space-y-1">
                        <h3 className="heading-meta text-foreground-light">Deployments</h3>
                        <p className="text-sm text-foreground">{selectedFunction.version}</p>
                      </div>
                    )}
                  </HoverCardContent>
                </HoverCard>
              </PageHeaderDescription>
            </PageHeaderSummary>

            <PageHeaderAside>
              <div className="flex items-center space-x-2">
                <DocsButton href={`${DOCS_URL}/guides/functions`} />
                <Popover_Shadcn_>
                  <PopoverTrigger_Shadcn_ asChild>
                    <Button type="default" icon={<Download />}>
                      Download
                    </Button>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ align="end" className="p-0">
                    {IS_PLATFORM && (
                      <>
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
                        <Separator className="bg-border-overlay!" />
                      </>
                    )}
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
                      if (IS_PLATFORM) {
                        sendEvent({
                          action: 'edge_function_test_side_panel_opened',
                          groups: {
                            project: ref ?? 'Unknown',
                            organization: org?.slug ?? 'Unknown',
                          },
                        })
                      }
                    }}
                  >
                    Test
                  </Button>
                )}
              </div>
            </PageHeaderAside>
          </PageHeaderMeta>

          {navigationItems.length > 0 && (
            <PageHeaderNavigationTabs>
              <NavMenu>
                {navigationItems.map((item) => {
                  const isActive = router.asPath.split('?')[0] === item.href
                  return (
                    <NavMenuItem key={item.label} active={isActive}>
                      <Link href={item.href}>{item.label}</Link>
                    </NavMenuItem>
                  )
                })}
              </NavMenu>
            </PageHeaderNavigationTabs>
          )}
        </PageHeader>

        {children}
        <EdgeFunctionTesterSheet visible={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </EdgeFunctionsLayout>
  )
}

export default withAuth(EdgeFunctionDetailsLayout)
