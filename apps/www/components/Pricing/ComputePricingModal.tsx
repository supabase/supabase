import React, { Fragment, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'common/Providers'
import { IconCheckCircle, IconXCircle, Modal } from 'ui'
import pricingAddOn from '~/data/PricingAddOnTable.json'
interface Props {
  showComputeModal: boolean
  setShowComputeModal: React.Dispatch<React.SetStateAction<boolean>>
}

export default function ComputePricingModal({ showComputeModal, setShowComputeModal }: Props) {
  const { basePath } = useRouter()
  const { isDarkMode } = useTheme()
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
      //onCancel={() => setVideoVisible(false)}
      hideFooter
      header={
        <div className="flex items-center justify-between z-20">
          <span className="text-scale-1200">Compute pricing</span>
          <IconXCircle
            className="text-scale-900 hover:text-scale-1200 w-4 cursor-pointer transition"
            onClick={() => setShowComputeModal(false)}
          />
        </div>
      }
    >
      <div className="z-10">
        <div>
          <div className="p-5">
            <div className="flex gap-8">
              <div className="prose">
                <div className="bg-brand-1000 rounded-xl w-12 h-12 flex justify-center items-center">
                  <img
                    className="w-6"
                    src={`${basePath}/images/pricing/compute-upgrade${
                      isDarkMode ? '-green' : ''
                    }.svg`}
                  />
                </div>
              </div>
              <div className="max-w-4xl">
                <h2 className="text-2xl">Choose best compute setup for you</h2>
                <p className="mt-4">
                  Every project on the Supabase Platform comes with its own dedicated Postgres
                  instance running inside a virtual machine (VM). The following table describes the
                  base instance with additional compute add-ons available if you need extra
                  performance when scaling up Supabase.
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <table className="text-scale-1200 m-0 hidden w-full table-auto overflow-hidden rounded-b lg:table text-xs">
              <thead>
                <tr className="">
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
                      <tr className="">
                        <td className="pb-1 rounded-tr-lg bg-scale-700 px-3 py-1 -mr-1 border-l-4 border-scale-700">
                          <span className="">Included in Free and Pro tiers</span>
                        </td>
                      </tr>
                    )}
                    <tr
                      key={i}
                      className={[
                        i % 2 === 0 ? 'bg-scale-300 rounded-lg' : '',
                        i === 0 ? 'border-4 border-scale-700' : '',
                      ].join(' ')}
                    >
                      {row.columns.map((column) => (
                        <td key={column.key} className="p-3">
                          {column.key === 'dedicated' ? (
                            <IconCheckCircle
                              size={14}
                              strokeWidth={2}
                              className={column.value ? 'text-brand-1000' : 'text-scale-700'}
                            />
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

          <table className="text-scale-1200 m-0 w-full table-auto overflow-hidden rounded-b lg:hidden">
            <tbody>
              {pricingAddOn.database.rows.map((row, i) => (
                <Fragment key={i}>
                  {row.columns.map((column) => (
                    <tr key={column.key} className={`${i % 2 === 0 && 'bg-scale-300'}`}>
                      <th className="py-3 pl-4 text-left font-medium">{column.title}</th>
                      <td className="px-4 py-3">{column.value}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
