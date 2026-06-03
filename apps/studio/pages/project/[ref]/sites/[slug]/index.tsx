import { useParams } from 'common'
import { ArrowLeft, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SitesLayout from '@/components/layouts/SitesLayout/SitesLayout'
import AlertError from '@/components/ui/AlertError'
import { useSiteDeployMutation } from '@/data/sites/site-deploy-mutation'
import { useSiteFilesQuery } from '@/data/sites/site-files-query'
import type { NextPageWithLayout } from '@/types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SiteDetailPage: NextPageWithLayout = () => {
  const { ref, slug } = useParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File[]>([])
  const [replace, setReplace] = useState(false)

  const {
    data: files,
    error,
    isPending,
    isError,
    isSuccess,
  } = useSiteFilesQuery({ projectRef: ref, slug })

  const { mutate: deploy, isPending: isDeploying } = useSiteDeployMutation({
    onSuccess: (data) => {
      toast.success(`Deployed ${data.files} file${data.files === 1 ? '' : 's'}`)
      setSelected([])
      if (inputRef.current) inputRef.current.value = ''
    },
  })

  const onDeploy = () => {
    if (!ref || !slug || selected.length === 0) return
    deploy({ projectRef: ref, slug, files: selected, mode: replace ? 'replace' : 'merge' })
  }

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          <div className="flex flex-col gap-6">
            <Card className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base text-foreground">Deploy files</h3>
                <p className="text-sm text-foreground-light">
                  Upload your build output. Select individual files (or a folder), or a single{' '}
                  <code className="text-code-inline">.zip</code> which is extracted on the server.
                </p>
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple
                className="block text-sm text-foreground-light"
                onChange={(e) => setSelected(Array.from(e.target.files ?? []))}
              />

              <label className="flex items-center gap-2 text-sm text-foreground-light">
                <input
                  type="checkbox"
                  checked={replace}
                  onChange={(e) => setReplace(e.target.checked)}
                />
                Replace all existing files (clears the docroot first)
              </label>

              <Button
                icon={<UploadCloud />}
                loading={isDeploying}
                disabled={selected.length === 0}
                onClick={onDeploy}
              >
                Deploy {selected.length > 0 ? `(${selected.length})` : ''}
              </Button>
            </Card>

            <div>
              <h3 className="text-base text-foreground mb-2">Files</h3>
              {isPending && <GenericSkeletonLoader />}
              {isError && <AlertError error={error} subject="Failed to list files" />}
              {isSuccess &&
                ((files ?? []).length === 0 ? (
                  <p className="text-sm text-foreground-light">No files deployed yet.</p>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Path</TableHead>
                          <TableHead>Size</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(files ?? []).map((file) => (
                          <TableRow key={file.relativePath}>
                            <TableCell className="font-mono text-xs">{file.relativePath}</TableCell>
                            <TableCell className="text-foreground-light">
                              {formatBytes(file.size)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ))}
            </div>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

SiteDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <SitesLayout title="Site">
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageHeader size="large">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>
                <SiteBreadcrumb />
              </PageHeaderTitle>
              <PageHeaderDescription>Manage files for this site</PageHeaderDescription>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>
        {page}
      </div>
    </SitesLayout>
  </DefaultLayout>
)

const SiteBreadcrumb = () => {
  const { ref, slug } = useParams()
  return (
    <span className="flex items-center gap-2">
      <Link
        href={`/project/${ref}/sites`}
        className="text-foreground-light hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft size={16} /> Sites
      </Link>
      <span className="text-foreground-light">/</span>
      <span>{slug}</span>
    </span>
  )
}

export default SiteDetailPage
