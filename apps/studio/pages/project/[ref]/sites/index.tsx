import { useParams } from 'common'
import { ExternalLink, Globe, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
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
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
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
import { useSiteCreateMutation } from '@/data/sites/site-create-mutation'
import { useSiteDeleteMutation } from '@/data/sites/site-delete-mutation'
import { useSitesQuery } from '@/data/sites/sites-query'
import type { SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'
import type { NextPageWithLayout } from '@/types'

const SitesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const [showForm, setShowForm] = useState(false)
  const [slug, setSlug] = useState('')
  const [domain, setDomain] = useState('')
  const [tls, setTls] = useState<SiteTlsMode>('off')
  const [spaFallback, setSpaFallback] = useState(true)
  const [apiProxy, setApiProxy] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null)

  const { data: sites, error, isPending, isError, isSuccess } = useSitesQuery({ projectRef: ref })

  const { mutate: createSite, isPending: isCreating } = useSiteCreateMutation({
    onSuccess: (site) => {
      toast.success(`Created site "${site.slug}"`)
      setShowForm(false)
      setSlug('')
      setDomain('')
      setTls('off')
      setSpaFallback(true)
      setApiProxy(false)
    },
  })

  const { mutate: deleteSite, isPending: isDeleting } = useSiteDeleteMutation({
    onSuccess: () => {
      toast.success('Site deleted')
      setSiteToDelete(null)
    },
  })

  const onSubmit = () => {
    if (!ref || !slug || !domain) return
    createSite({ projectRef: ref, slug, domain, tls, spaFallback, apiProxy })
  }

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          <div className="flex flex-col gap-6">
            {!showForm && (
              <div className="flex justify-end">
                <Button icon={<Plus />} onClick={() => setShowForm(true)}>
                  New site
                </Button>
              </div>
            )}
            {showForm && (
              <Card className="p-6 space-y-4">
                <h3 className="text-base text-foreground">New site</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-foreground-light" htmlFor="slug">
                      Slug
                    </label>
                    <Input
                      id="slug"
                      placeholder="my-app"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-foreground-light" htmlFor="domain">
                      Domain
                    </label>
                    <Input
                      id="domain"
                      placeholder="app.example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-foreground-light" htmlFor="tls">
                      TLS
                    </label>
                    <select
                      id="tls"
                      className="block w-full rounded-md border border-control bg-foreground/[.026] text-sm px-3 py-2 text-foreground"
                      value={tls}
                      onChange={(e) => setTls(e.target.value as SiteTlsMode)}
                    >
                      <option value="off">HTTP only (local / dev)</option>
                      <option value="acme">Auto TLS (Let&apos;s Encrypt)</option>
                      <option value="byo">Bring your own certificate</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 justify-end">
                    <label className="flex items-center gap-2 text-sm text-foreground-light">
                      <input
                        type="checkbox"
                        checked={spaFallback}
                        onChange={(e) => setSpaFallback(e.target.checked)}
                      />
                      SPA fallback (serve index.html for unknown routes)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground-light">
                      <input
                        type="checkbox"
                        checked={apiProxy}
                        onChange={(e) => setApiProxy(e.target.checked)}
                      />
                      Proxy API to backend (same-origin /rest, /auth…)
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={onSubmit} loading={isCreating} disabled={!slug || !domain}>
                    Create site
                  </Button>
                  <Button type="default" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve sites" />}

            {isSuccess &&
              ((sites ?? []).length === 0 && !showForm ? (
                <Admonition
                  type="default"
                  title="No sites yet"
                  description="Host a static or single-page front-end served by the built-in nginx, with a same-origin backend."
                >
                  <Button className="mt-2" icon={<Plus />} onClick={() => setShowForm(true)}>
                    New site
                  </Button>
                </Admonition>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>TLS</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sites ?? []).map((site) => (
                        <TableRow
                          key={site.id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/project/${ref}/sites/${site.slug}`)}
                        >
                          <TableCell>
                            <span className="flex items-center gap-2 text-foreground">
                              <Globe size={14} strokeWidth={1.5} />
                              {site.slug}
                            </span>
                          </TableCell>
                          <TableCell className="text-foreground-light">
                            <a
                              href={`${site.tls === 'off' ? 'http' : 'https'}://${site.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {site.domain}
                              <ExternalLink size={12} />
                            </a>
                          </TableCell>
                          <TableCell className="text-foreground-light uppercase text-xs">
                            {site.tls}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="text"
                              icon={<Trash2 size={14} />}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSiteToDelete(site.slug)
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ))}
          </div>
        </PageSectionContent>
      </PageSection>

      <ConfirmationModal
        variant="destructive"
        visible={!!siteToDelete}
        loading={isDeleting}
        title={`Delete site “${siteToDelete}”`}
        confirmLabel="Delete site"
        confirmLabelLoading="Deleting"
        onCancel={() => setSiteToDelete(null)}
        onConfirm={() => {
          if (ref && siteToDelete) deleteSite({ projectRef: ref, slug: siteToDelete })
        }}
      >
        <p className="text-sm text-foreground-light">
          This removes the nginx server block and deletes the site files from disk. This cannot be
          undone.
        </p>
      </ConfirmationModal>
    </PageContainer>
  )
}

SitesPage.getLayout = (page) => (
  <DefaultLayout>
    <SitesLayout title="Sites">
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageHeader size="large">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Sites</PageHeaderTitle>
              <PageHeaderDescription>
                Host static and single-page front-ends on the built-in web server
              </PageHeaderDescription>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>
        {page}
      </div>
    </SitesLayout>
  </DefaultLayout>
)

export default SitesPage
