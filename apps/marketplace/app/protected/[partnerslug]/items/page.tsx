import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Button,
  Card,
  Input,
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

import { getMarketplaceSidebarData } from '@/lib/marketplace/server'

type PartnerItemsPageProps = {
  params: {
    partnerslug: string
  }
  searchParams?:
    | {
        q?: string
      }
    | Promise<{
        q?: string
      }>
}

export default async function PartnerItemsPage({ params, searchParams }: PartnerItemsPageProps) {
  const { partnerslug } = params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const searchQuery = (resolvedSearchParams?.q ?? '').trim()
  const { user, partners } = await getMarketplaceSidebarData()

  if (!user) {
    notFound()
  }
  const partner = partners.find((entry) => entry.slug === partnerslug)

  if (!partner) {
    notFound()
  }
  const items = partner.items
  const normalizedSearchQuery = searchQuery.toLowerCase()
  const filteredItems =
    normalizedSearchQuery.length === 0
      ? items
      : items.filter(
          (item) =>
            item.title.toLowerCase().includes(normalizedSearchQuery) ||
            item.slug.toLowerCase().includes(normalizedSearchQuery)
        )

  return (
    <div className="w-full">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Items</PageHeaderTitle>
            <PageHeaderDescription>Manage items for {partner.title}</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <div className="w-full space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                  <form method="get">
                    <Input
                      name="q"
                      placeholder="Search items"
                      size="tiny"
                      icon={<Search />}
                      className="w-full lg:w-52"
                      defaultValue={searchQuery}
                    />
                  </form>
                </div>
                <Button asChild type="primary" icon={<Plus size={16} strokeWidth={1.5} />}>
                  <Link href={`/protected/${partner.slug}/items/new`}>
                    <span>Create item</span>
                  </Link>
                </Button>
              </div>
              {filteredItems.length === 0 ? (
                <Card className="p-6 text-sm text-muted-foreground">
                  {searchQuery.length > 0
                    ? 'No items match this search.'
                    : 'No items yet. Create your first item to get started.'}
                </Card>
              ) : (
                <Card>
                  <Table className="table-fixed overflow-x-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Slug</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="p-0 font-medium">
                            <Link
                              href={`/protected/${partner.slug}/items/${item.slug}`}
                              className="block px-4 py-4 group-hover:underline"
                            >
                              {item.title}
                            </Link>
                          </TableCell>
                          <TableCell className="p-0 text-muted-foreground">
                            <Link
                              href={`/protected/${partner.slug}/items/${item.slug}`}
                              className="block px-4 py-4 group-hover:underline"
                            >
                              /{item.slug}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}
