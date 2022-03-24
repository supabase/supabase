import React from 'react'
import ReactDOM from 'react-dom'
import { IconHelpCircle, IconWatch, Space } from '@supabase/ui'
import ReactTooltip from 'react-tooltip'
import ProductIcon from 'components/ProductIcon'

const Chevron = (props: any) => (
  <>
    <svg
      className={`h-5 w-5 text-green-900`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Included in {props.tier}</span>
  </>
)

const Minus = (props: any) => (
  <>
    <svg
      className="h-5 w-5 text-scale-1200 dark:text-white"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Not included in {props.tier}</span>
  </>
)

export const PricingTableRowDesktop = (props: any) => {
  const category = props.category

  return (
    <>
      <tr className="divide-x dark:divide-scale-900" style={{ borderTop: 'none' }}>
        <th
          className="pricing-table__product-row bg-scale-50 dark:bg-scale-300 py-3 pl-6 text-sm font-medium text-scale-1200 dark:text-white text-left"
          scope="colgroup"
        >
          <div className="flex items-center">
            {props.icon && <ProductIcon icon={props.icon} />}
            <h4 className="m-0 ml-2">{category.title}</h4>
          </div>
        </th>
        <td className="pricing-table__product-row bg-scale-50 dark:bg-scale-300 py-5 px-6"></td>
        <td className="pricing-table__product-row bg-scale-50 dark:bg-scale-300 py-5 px-6"></td>
        <td className="pricing-table__product-row bg-scale-50 dark:bg-scale-300 py-5 px-6"></td>
      </tr>

      {category.features.map((feat: any) => {
        return (
          <tr className="divide-x divide-scale-600 dark:divide-scale-400">
            <th
              className="flex items-center py-5 px-6 text-sm font-normal text-scale-1200 dark:text-white text-left"
              scope="row"
            >
              <span>{feat.title} </span>
              {feat.tooltip && (
                <span
                  className="ml-2 cursor-pointer hover:text-scale-800 dark:hover:text-white"
                  data-tip={feat.tooltip}
                >
                  <IconHelpCircle size="small" />
                </span>
              )}
            </th>

            {Object.values(feat.tiers).map((tier: any) => {
              return (
                <td className="py-5 px-6">
                  {typeof tier === 'boolean' && tier === true ? (
                    <Chevron tier={tier} />
                  ) : typeof tier === 'boolean' && tier === false ? (
                    <Minus tier={tier} />
                  ) : (
                    <span className="block text-sm text-scale-1200 dark:text-white">{tier}</span>
                  )}
                </td>
              )
            })}
          </tr>
        )
      })}
      <ReactTooltip effect={'solid'} />
    </>
  )
}

export const PricingTableRowMobile = (props: any) => {
  const category = props.category
  const tier = props.tier

  return (
    <>
      <table className="mt-8 w-full">
        <caption className="bg-scale-50 dark:bg-dark-900 border-t border-scale-200 dark:border-scale-600 py-3 px-4 text-sm font-medium text-scale-1200 dark:text-white text-left">
          <div className="flex items-center gap-2">
            {category.icon ? <ProductIcon icon={props.icon} /> : null}
            <span className="text-scale-1200 font-normal">{category.title}</span>
          </div>
        </caption>
        <thead>
          <tr>
            <th className="sr-only" scope="col">
              Feature
            </th>
            <th className="sr-only" scope="col">
              Included
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-scale-600">
          {category.features.map((feat: any) => {
            return (
              <tr className="border-t ">
                <th className="py-5 px-4 text-sm font-normal text-scale-1100 text-left" scope="row">
                  <span>
                    <p>{feat.title}</p>
                  </span>
                </th>
                <td className="py-5 pr-4 text-right">
                  {typeof feat.tiers[tier] === 'boolean' && feat.tiers[tier] === true ? (
                    <div className="inline-block">
                      <Chevron tier={tier} />
                    </div>
                  ) : typeof feat.tiers[tier] === 'boolean' && feat.tiers[tier] === false ? (
                    <div className="inline-block">
                      <Minus tier={tier} />
                    </div>
                  ) : (
                    <span className="block text-sm text-scale-1200">{feat.tiers[tier]}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <ReactTooltip effect={'solid'} />
    </>
  )
}
