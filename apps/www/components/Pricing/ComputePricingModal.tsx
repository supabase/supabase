import React, { Fragment, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { IconXCircle, Modal } from 'ui'
import pricingAddOn from '~/data/PricingAddOnTable.json'
import { IconPricingIncludedCheck, IconPricingMinus } from './PricingIcons'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  showComputeModal: boolean
  setShowComputeModal: React.Dispatch<React.SetStateAction<boolean>>
}

export default function ComputePricingModal({ showComputeModal, setShowComputeModal }: Props) {
  const { basePath } = useRouter()
  const { resolvedTheme } = useTheme()
  const columnNames = useMemo(
    () =>
      pricingAddOn.database.rows.map((row) =>
        row.columns.map((column) => ({ key: column.key, title: column.title }))
      )[0],
    []
  )

  return (
    <Modal
      size="xxlarge"
      visible={showComputeModal}
      onCancel={() => setShowComputeModal(false)}
      hideFooter
    >
      <>
        <IconXCircle
          className="absolute right-3 top-3 text-muted hover:text-foreground w-8 cursor-pointer transition"
          onClick={() => setShowComputeModal(false)}
        />
        <div className="p-5">
          <div className="grid lg:flex gap-8">
            <div className="prose">
              <div className="bg-brand-200 rounded-xl w-12 h-12 flex justify-center items-center">
                <Image
                  width={24}
                  height={24}
                  className="w-6"
                  src={`${basePath}/images/pricing/compute-upgrade${
                    resolvedTheme?.includes('dark') ? '-green' : '-light'
                  }.svg`}
                  alt=""
                />
              </div>
            </div>
            <div className="max-w-4xl prose">
              <h2 className="text-lg">Choose best compute setup for you</h2>
              <p className="text-sm">
                Every project on the Supabase Platform comes with its own dedicated Postgres
                instance running inside a virtual machine (VM). The following table describes the
                base instance with additional compute add-ons available if you need extra
                performance when scaling up Supabase.
              </p>
              <p className="text-sm">
                Compute instances are billed hourly and you can scale up or down at any time if you
                need extra performance. You'll only be charged at the end of the month for the hours
                you've used. Paid plans come with $10 in Compute Credits to cover one Starter
                instance or parts of any other instance. Compute Credits are given to you not only
                for the first month but for every month while you are on a paid plan. Read more on{' '}
                <Link
                  href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
                  target="_blank"
                  className="transition text-brand hover:text-brand-600"
                >
                  usage-based billing for compute
                </Link>{' '}
                or{' '}
                <Link
                  href="https://supabase.com/docs/guides/platform/compute-add-ons"
                  target="_blank"
                  className="transition text-brand hover:text-brand-600"
                >
                  Compute Add-ons
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <table className="text-foreground m-0 hidden w-full table-auto overflow-hidden rounded-b lg:table text-xs">
            <thead>
              <tr>
                {columnNames.map((column) => (
                  <th key={column.key} className="p-3 text-left font-medium">
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingAddOn.database.rows.map((row, i) => (
                <Fragment key={`row-${i}`}>
                  {i === 0 && (
                    <tr>
                      <td className="pb-1 bg-border-strong px-3 py-1 -mr-1 border-l-4 border-strong">
                        <span>First instance is free on paid plans</span>
                      </td>
                    </tr>
                  )}
                  <tr
                    key={i}
                    className={[
                      i % 2 === 0 ? 'bg-surface-100 rounded-lg' : '',
                      i === 0 ? 'border-4 border-strong' : '',
                    ].join(' ')}
                  >
                    {row.columns.map((column) => (
                      <td key={column.key} className="p-3">
                        {column.key === 'dedicated' ? (
                          column.value ? (
                            <IconPricingIncludedCheck plan="Pro plan" />
                          ) : (
                            <IconPricingMinus plan="Free plan" />
                          )
                        ) : (
                          column.value
                        )}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <table className="text-foreground m-0 w-full table-auto overflow-hidden rounded-b lg:hidden text-xs">
          <tbody>
            {pricingAddOn.database.rows.map((row, i) => (
              <Fragment key={i}>
                {row.columns.map((column) => (
                  <tr key={column.key}>
                    <th
                      className={`py-3 pl-4 text-left font-medium ${
                        column.key === 'plan' ? 'pt-16 lg:pt-3' : ''
                      }`}
                    >
                      {column.title}
                    </th>
                    <td
                      className={`px-4 py-3 ${
                        column.key === 'plan' ? 'text-brand pt-16 lg:pt-3' : ''
                      }`}
                    >
                      {column.key === 'dedicated' ? (
                        column.value ? (
                          <IconPricingIncludedCheck plan="Pro plan" />
                        ) : (
                          <IconPricingMinus plan="Free plan" />
                        )
                      ) : (
                        column.value
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </>
    </Modal>
  )
}
