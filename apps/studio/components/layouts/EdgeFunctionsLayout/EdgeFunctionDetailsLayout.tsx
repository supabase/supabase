import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { IS_PLATFORM, useParams } from 'common'
import { CopyIcon, DownloadIcon, FileArchiveIcon, SendIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  copyToClipboard,
  NavMenu,
  NavMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageNav } from 'ui-patterns/PageNav'

import { ProjectLayout } from '../ProjectLayout'
import EdgeFunctionsLayout from './EdgeFunctionsLayout'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { extractFunctionSourcesFromEszip } from '@/components/interfaces/EdgeFunctions/EdgeFunctions.eszip'
import { getFunctionZipEntries } from '@/components/interfaces/EdgeFunctions/EdgeFunctions.utils'
import { EdgeFunctionTesterSheet } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet'
import { useFunctionsDetailShortcuts } from '@/components/interfaces/Functions/useFunctionsDetailShortcuts'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import {
  getEdgeFunctionBodyEszip,
  isFunctionBodyMaxSizeError,
  useEdgeFunctionBodyQuery,
} from '@/data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { withAuth } from '@/hooks/misc/withAuth'
import { DOCS_URL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/get-error-message'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface EdgeFunctionDetailsLayoutProps {
  title: string
}

const EdgeFunctionDetailsLayout = ({
  title,
  children,
}: PropsWithChildren<EdgeFunctionDetailsLayoutProps>) => {
  const router = useRouter()
  const track = useTrack()
  const { functionSlug, ref } = useParams()

  const { isLoading, can: canReadFunctions } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ
  )

  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const [isOpen, setIsOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

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
  const browserTitle = {
    entity: functionSlug ? name || functionSlug : undefined,
    section: title,
  }

  const navigationItems = functionSlug
    ? [
        ...(IS_PLATFORM
          ? [
              {
                label: 'Overview',
                href: `/project/${ref}/functions/${functionSlug}`,
              },
              ...(isUnifiedLogsEnabled
                ? []
                : [
                    {
                      label: 'Invocations',
                      href: `/project/${ref}/functions/${functionSlug}/invocations`,
                    },
                  ]),
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

  const downloadFunctionZip = async () => {
    const isExceedMaxSize = isFunctionBodyMaxSizeError(filesError)
    if (filesError && !isExceedMaxSize) {
      return toast.error('Failed to retrieve edge function files')
    }

    // The multipart response is capped in size, so for large functions we fall back to the raw
    // eszip bundle and extract the original sources from it
    let zipEntries = getFunctionZipEntries({
      files: functionBody.files,
      slug: functionSlug ?? '',
      source: 'multipart',
    })

    if (isExceedMaxSize) {
      try {
        const eszip = await getEdgeFunctionBodyEszip({ projectRef: ref, slug: functionSlug })
        const files = extractFunctionSourcesFromEszip(eszip)
        zipEntries = getFunctionZipEntries({ files, slug: functionSlug ?? '', source: 'eszip' })
      } catch (error) {
        return toast.error(
          `Failed to download edge function: ${getErrorMessage(error, 'Unknown error')}`
        )
      }
    }

    const zipFileWriter = new BlobWriter('application/zip')
    const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true })

    zipEntries.forEach(({ path, content }) => {
      zipWriter.add(path, new BlobReader(new Blob([content])))
    })

    const blobURL = URL.createObjectURL(await zipWriter.close())
    const link = document.createElement('a')
    link.href = blobURL
    link.setAttribute('download', `${functionSlug}.zip`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    // Deferred so the browser has started the download before the URL is released
    setTimeout(() => URL.revokeObjectURL(blobURL), 0)
  }

  const handleDownloadZip = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await downloadFunctionZip()
    } finally {
      setIsDownloading(false)
    }
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

  const openTestSheet = () => {
    if (!functionSlug) return
    setIsOpen(true)
    if (IS_PLATFORM) {
      track('edge_function_test_side_panel_opened')
    }
  }

  const copyFunctionUrl = () => {
    if (!functionUrl) return
    copyToClipboard(functionUrl)
    toast.success('Function URL copied to clipboard')
  }

  useFunctionsDetailShortcuts({
    projectRef: ref,
    functionSlug,
    canReadFunctions,
    isPlatform: IS_PLATFORM,
    hasInvocationsTab: !isUnifiedLogsEnabled,
    onOpenTest: openTestSheet,
    onOpenDownload: () => setIsDownloadOpen((prev) => !prev),
    onCopyUrl: copyFunctionUrl,
  })

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
        <div className="sticky top-0 z-10 bg-sidebar">
          <PageBreadcrumbs
            actions={
              <PageBreadcrumbsActions>
                <DocsButton href={`${DOCS_URL}/guides/functions`} />
                {!IS_PLATFORM && !!functionUrl && (
                  <ShortcutTooltip shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL} side="bottom">
                    <Button icon={<CopyIcon />} onClick={copyFunctionUrl}>
                      Copy URL
                    </Button>
                  </ShortcutTooltip>
                )}
                <Popover open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
                  <ShortcutTooltip
                    shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_DOWNLOAD}
                    side="bottom"
                    open={isDownloadOpen ? false : undefined}
                  >
                    <PopoverTrigger asChild>
                      <Button icon={<DownloadIcon />}>Download</Button>
                    </PopoverTrigger>
                  </ShortcutTooltip>
                  <PopoverContent align="end" className="p-0">
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
                        variant="text"
                        className="w-min hover:bg-transparent"
                        icon={<FileArchiveIcon />}
                        loading={isDownloading}
                        onClick={handleDownloadZip}
                      >
                        Download as ZIP
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {!!functionSlug && (
                  <ShortcutTooltip
                    shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST}
                    side="bottom"
                  >
                    <Button icon={<SendIcon />} onClick={openTestSheet}>
                      Test
                    </Button>
                  </ShortcutTooltip>
                )}
              </PageBreadcrumbsActions>
            }
          >
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/project/${ref}/functions`}>Edge Functions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{name || functionSlug}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageBreadcrumbs>

          {navigationItems.length > 0 && (
            <PageNav>
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
            </PageNav>
          )}
        </div>

        {children}
        <EdgeFunctionTesterSheet visible={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </EdgeFunctionsLayout>
  )
}

export default withAuth(EdgeFunctionDetailsLayout)
