import { IconHelpCircle } from 'ui'
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
      className="text-scale-600 h-5 w-5"
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
        className="divide-scale-600 dark:divide-scale-400 bg-scale-200 divide-x"
        style={{ borderTop: 'none' }}
      >
        <th
          className="bg-scale-200 bg-scale-50 dark:bg-scale-300 text-scale-1200 sticky top-[62px] z-10 py-3 pl-6 text-left text-sm font-medium dark:text-white"
          scope="colgroup"
        >
          <div className="flex items-center">
            {props.icon && <ProductIcon icon={props.icon} />}
            <h4 className="m-0 ml-2">{category.title}</h4>
          </div>
        </th>
        <td className="bg-scale-50 dark:bg-scale-300 px-6 py-5"></td>
        <td className="bg-scale-50 dark:bg-scale-300 px-6 py-5"></td>
        <td className="bg-scale-50 dark:bg-scale-300 px-6 py-5"></td>
      </tr>

      {category.features.map((feat: any, i: number) => {
        return (
          <tr className="divide-scale-600 dark:divide-scale-400 divide-x" key={i}>
            <th
              className="text-scale-1200 flex items-center px-6 py-3 text-left text-sm font-normal dark:text-white"
              scope="row"
            >
              <span>{feat.title}</span>
              {feat.tooltip && (
                <span
                  className="text-scale-900 hover:text-scale-1200 ml-2 cursor-pointer transition-colors"
                  data-tip={feat.tooltip}
                >
                  <IconHelpCircle size={14} strokeWidth={2} />
                </span>
              )}
            </th>

            {Object.values(feat.tiers).map((tier: any, i) => {
              return (
                <td key={i} className="px-6">
                  {typeof tier === 'boolean' && tier === true ? (
                    <IncludedCheck tier={tier} />
                  ) : typeof tier === 'boolean' && tier === false ? (
                    <div className="text-scale-900">
                      <Minus tier={tier} />
                    </div>
                  ) : (
                    <span className="text-scale-1200 block text-sm dark:text-white">{tier}</span>
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
        <caption className="bg-scale-50 dark:bg-dark-900 border-scale-400 border-t px-4 py-3 text-left text-sm font-medium dark:text-white">
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
        <tbody className="divide-scale-400 divide-y">
          {category.features.map((feat: any, i: number) => {
            return (
              <tr key={i} className="border-scale-400 border-t">
                <th className="text-scale-1100 px-4 py-3 text-left text-sm font-normal" scope="row">
                  <span>
                    <p>{feat.title}</p>
                  </span>
                </th>
                <td className="py-3 pr-4 text-right">
                  {typeof feat.tiers[tier] === 'boolean' && feat.tiers[tier] === true ? (
                    <div className="inline-block">
                      <IncludedCheck tier={tier} />
                    </div>
                  ) : typeof feat.tiers[tier] === 'boolean' && feat.tiers[tier] === false ? (
                    <div className="inline-block">
                      <Minus tier={tier} />
                    </div>
                  ) : (
                    <span className="text-scale-1200 block text-sm">{feat.tiers[tier]}</span>
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
