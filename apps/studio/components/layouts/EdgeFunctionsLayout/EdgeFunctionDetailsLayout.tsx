import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { IS_PLATFORM, useParams } from 'common'
import { Download, FileArchive, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
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
import { EdgeFunctionTesterSheet } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet'
import { useFunctionsDetailShortcuts } from '@/components/interfaces/Functions/useFunctionsDetailShortcuts'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useEdgeFunctionBodyQuery } from '@/data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { withAuth } from '@/hooks/misc/withAuth'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface EdgeFunctionDetailsLayoutProps {
  title?: string
}

const EdgeFunctionDetailsLayout = ({
  title,
  children,
}: PropsWithChildren<EdgeFunctionDetailsLayoutProps>) => {
  const router = useRouter()
  const track = useTrack()
  const { functionSlug, ref } = useParams()

  const { isLoading, can: canReadFunctions } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    '*'
  )

  const [isOpen, setIsOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
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
  const sectionTitle = useMemo(() => {
    if (title) return title

    const path = router.pathname
    if (path.endsWith('/logs')) return 'Logs'
    if (path.endsWith('/invocations')) return 'Invocations'
    if (path.endsWith('/code')) return 'Code'
    if (path.endsWith('/details')) return 'Settings'

    return 'Overview'
  }, [router.pathname, title])
  const browserTitle = {
    entity: functionSlug ? name || functionSlug : undefined,
    section: sectionTitle,
  }

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
    <EdgeFunctionsLayout title={sectionTitle} browserTitle={browserTitle}>
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageBreadcrumbs
          actions={
            <PageBreadcrumbsActions>
              <DocsButton href={`${DOCS_URL}/guides/functions`} />
              <Popover open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
                <ShortcutTooltip
                  shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_DOWNLOAD}
                  side="bottom"
                  open={isDownloadOpen ? false : undefined}
                >
                  <PopoverTrigger asChild>
                    <Button variant="default" size="tiny" icon={<Download />}>
                      Download
                    </Button>
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
                      icon={<FileArchive />}
                      onClick={downloadFunction}
                    >
                      Download as ZIP
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {!!functionSlug && (
                <ShortcutTooltip shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST} side="bottom">
                  <Button variant="default" size="tiny" icon={<Send />} onClick={openTestSheet}>
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
            {functionSlug ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{functionSlug}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
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

        {children}
        <EdgeFunctionTesterSheet visible={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </EdgeFunctionsLayout>
  )
}

export default withAuth(EdgeFunctionDetailsLayout)
