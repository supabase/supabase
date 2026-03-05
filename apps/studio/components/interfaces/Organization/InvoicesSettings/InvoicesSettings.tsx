import InvoiceStatusBadge from 'components/interfaces/Billing/InvoiceStatusBadge'
import { InvoiceStatus } from 'components/interfaces/Billing/Invoices.types'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { getInvoice } from 'data/invoices/invoice-query'
import { getInvoiceReceipt } from 'data/invoices/invoice-receipt-query'
import { useInvoicesCountQuery } from 'data/invoices/invoices-count-query'
import { useInvoicesQuery } from 'data/invoices/invoices-query'
import dayjs from 'dayjs'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from 'lib/constants/infrastructure'
import { formatCurrency } from 'lib/helpers'
import { ChevronLeft, ChevronRight, FileText, Receipt, ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Organization } from 'types/base'
import {
  Button,
  Card,
  CardFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import InvoicePayButton from './InvoicePayButton'

const PAGE_LIMIT = 5

const getPartnerManagedResourceCta = (selectedOrganization: Organization) => {
  if (selectedOrganization.managed_by === MANAGED_BY.VERCEL_MARKETPLACE) {
    return {
      installationId: selectedOrganization?.partner_id,
      path: '/invoices',
    }
  }
  if (selectedOrganization.managed_by === MANAGED_BY.AWS_MARKETPLACE) {
    return {
      organizationSlug: selectedOrganization?.slug,
      overrideUrl: 'https://console.aws.amazon.com/billing/home#/bills',
    }
  }
}
export const InvoicesSettings = () => {
  const [page, setPage] = useState(1)

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const slug = selectedOrganization?.slug
  const offset = (page - 1) * PAGE_LIMIT

  const { data: count, isError: isErrorCount } = useInvoicesCountQuery(
    {
      slug,
    },
    { enabled: selectedOrganization?.managed_by === 'supabase' }
  )
  const {
    data,
    error,
    isPending: isLoading,
    isError,
  } = useInvoicesQuery(
    {
      slug,
      offset,
      limit: PAGE_LIMIT,
    },
    { enabled: selectedOrganization?.managed_by === 'supabase' }
  )
  const invoices = data || []

  useEffect(() => {
    setPage(1)
  }, [slug])

  const fetchInvoice = async (id: string) => {
    try {
      const invoice = await getInvoice({ invoiceId: id, slug })
      if (invoice?.invoice_pdf) window.open(invoice.invoice_pdf, '_blank')
    } catch (error: any) {
      toast.error(`Failed to fetch the selected invoice: ${error.message}`)
    }
  }

  const fetchReceipt = async (invoiceId: string) => {
    if (!slug) return

    try {
      const receipt = await getInvoiceReceipt({ invoiceId, slug })
      if (receipt?.receipt_pdf) window.open(receipt.receipt_pdf, '_blank')
    } catch (error: any) {
      toast.error(`Failed to fetch receipt: ${error.message}`)
    }
  }

  if (
    selectedOrganization?.managed_by !== undefined &&
    selectedOrganization?.managed_by !== 'supabase'
  ) {
    return (
      <PartnerManagedResource
        managedBy={selectedOrganization?.managed_by}
        resource="Invoices"
        cta={getPartnerManagedResourceCta(selectedOrganization)}
      />
    )
  }

  // Handle loading state faded text for table headers
  const tableHeadClassName =
    isLoading || invoices.length === 0 ? 'text-foreground-muted' : undefined

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {invoices.length > 0 && (
              <TableHead className="w-2">
                <span className="sr-only">Icon</span>
              </TableHead>
            )}
            <TableHead className={cn(tableHeadClassName)}>Date</TableHead>
            <TableHead className={cn(tableHeadClassName)}>Amount</TableHead>
            <TableHead className={cn(tableHeadClassName)}>Invoice number</TableHead>
            <TableHead className={cn(tableHeadClassName)}>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            new Array(6).fill(0).map((_, idx) => (
              <TableRow key={`loading-${idx}`}>
                <TableCell colSpan={invoices.length > 0 ? 6 : 5}>
                  <ShimmeringLoader />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="rounded-b">
              <TableCell
                colSpan={invoices.length > 0 ? 6 : 5}
                className="!p-0 !rounded-b overflow-hidden"
              >
                <AlertError
                  className="border-0 rounded-none"
                  error={error}
                  subject="Failed to retrieve invoices"
                />
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={5} className="py-6">
                <p className="text-foreground-lighter">No invoices for this organization yet</p>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {invoices.map((x) => {
                return (
                  <TableRow key={x.id}>
                    <TableCell className="w-2">
                      <FileText aria-hidden="true" size={16} className="text-foreground-muted" />
                    </TableCell>
                    <TableCell>
                      <p>{dayjs(x.period_end * 1000).format('MMM DD, YYYY')}</p>
                    </TableCell>
                    <TableCell translate="no">
                      <p>{formatCurrency(x.amount_due / 100)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-foreground-light">{x.number}</p>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge
                        status={x.status as InvoiceStatus}
                        paymentAttempted={x.payment_attempted}
                        paymentProcessing={x.payment_is_processing}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {x.amount_due > 0 &&
                          !x.payment_is_processing &&
                          [
                            InvoiceStatus.UNCOLLECTIBLE,
                            InvoiceStatus.OPEN,
                            InvoiceStatus.ISSUED,
                          ].includes(x.status as InvoiceStatus) && (
                            <InvoicePayButton slug={slug} invoiceId={x.id} />
                          )}

                        <ButtonTooltip
                          type="outline"
                          className="w-7"
                          icon={<ScrollText size={16} strokeWidth={1.5} />}
                          onClick={() => fetchInvoice(x.id)}
                          tooltip={{ content: { side: 'bottom', text: 'Download invoice' } }}
                        />

                        {x.status === InvoiceStatus.PAID && x.amount_due > 0 && (
                          <ButtonTooltip
                            type="outline"
                            className="w-7"
                            icon={<Receipt size={16} strokeWidth={1.5} />}
                            onClick={() => fetchReceipt(x.id)}
                            tooltip={{ content: { side: 'bottom', text: 'Download receipt' } }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </>
          )}
        </TableBody>
      </Table>
      {invoices.length > 0 && (
        <CardFooter className="border-t p-4 flex items-center justify-between">
          <p className="text-foreground-muted text-sm">
            {isErrorCount
              ? 'Failed to retrieve total number of invoices'
              : typeof count === 'number'
                ? `Showing ${offset + 1} to ${offset + invoices.length} out of ${count} invoices`
                : `Showing ${offset + 1} to ${offset + invoices.length} invoices`}
          </p>
          <div className="flex items-center gap-x-2" aria-label="Pagination">
            <Button
              icon={<ChevronLeft />}
              aria-label="Previous page"
              type="default"
              size="tiny"
              disabled={page === 1}
              onClick={async () => setPage(page - 1)}
            />
            <Button
              icon={<ChevronRight />}
              aria-label="Next page"
              type="default"
              size="tiny"
              disabled={page * PAGE_LIMIT >= (count ?? 0)}
              onClick={async () => setPage(page + 1)}
            />
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
