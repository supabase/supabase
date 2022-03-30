import { IconHelpCircle } from '@supabase/ui'
import ProductIcon from 'components/ProductIcon'
import React from 'react'
import ReactTooltip from 'react-tooltip'

export const Check = () => (
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
)

const IncludedCheck = (props: any) => (
  <>
    <Check />
    <span className="sr-only">Included in {props.tier}</span>
  </>
)

const Minus = (props: any) => (
  <>
    <svg
      className="w-5 h-5 text-scale-1200 dark:text-white"
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
      <tr
        className="divide-x divide-scale-600 dark:divide-scale-400 bg-scale-200"
        style={{ borderTop: 'none' }}
      >
        <th
          className="py-3 pl-6 sticky z-10 top-[62px] text-sm font-medium bg-scale-200 text-left bg-scale-50 dark:bg-scale-300 text-scale-1200 dark:text-white"
          scope="colgroup"
        >
          <div className="flex items-center">
            {props.icon && <ProductIcon icon={props.icon} />}
            <h4 className="m-0 ml-2">{category.title}</h4>
          </div>
        </th>
        <td className="px-6 py-5 bg-scale-50 dark:bg-scale-300"></td>
        <td className="px-6 py-5 bg-scale-50 dark:bg-scale-300"></td>
        <td className="px-6 py-5 bg-scale-50 dark:bg-scale-300"></td>
      </tr>

      {category.features.map((feat: any) => {
        return (
          <tr className="divide-x divide-scale-600 dark:divide-scale-400">
            <th
              className="flex items-center px-6 py-5 text-sm font-normal text-left text-scale-1200 dark:text-white"
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

            {Object.values(feat.tiers).map((tier: any, i) => {
              return (
                <td key={i} className="px-6 py-5">
                  {typeof tier === 'boolean' && tier === true ? (
                    <IncludedCheck tier={tier} />
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
      <table className="w-full mt-8">
        <caption className="px-4 py-3 text-sm font-medium text-left border-t bg-scale-50 dark:bg-dark-900 border-scale-200 dark:border-scale-600 text-scale-1200 dark:text-white">
          <div className="flex items-center gap-2">
            {category.icon ? <ProductIcon icon={props.icon} /> : null}
            <span className="font-normal text-scale-1200">{category.title}</span>
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
          {category.features.map((feat: any, i: number) => {
            return (
              <tr key={i} className="border-t">
                <th className="px-4 py-5 text-sm font-normal text-left text-scale-1100" scope="row">
                  <span>
                    <p>{feat.title}</p>
                  </span>
                </th>
                <td className="py-5 pr-4 text-right">
                  {typeof feat.tiers[tier] === 'boolean' && feat.tiers[tier] === true ? (
                    <div className="inline-block">
                      <IncludedCheck tier={tier} />
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
