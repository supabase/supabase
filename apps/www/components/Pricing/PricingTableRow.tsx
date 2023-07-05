import { IconHelpCircle } from 'ui'
import ProductIcon from 'components/ProductIcon'
import React, { Fragment } from 'react'
import ReactTooltip from 'react-tooltip'
import { IconPricingIncludedCheck, IconPricingInfo, IconPricingMinus } from './PricingIcons'

export const PricingTableRowDesktop = (props: any) => {
  const category = props.category

  return (
    <>
      <tr
        className="divide-scale-600 dark:divide-scale-400 bg-scale-200"
        style={{ borderTop: 'none' }}
        id={`${props.sectionId}-desktop`}
      >
        <th
          className="border-b border-scale-600 bg-scale-200 bg-scale-50 dark:bg-scale-200 text-scale-1200 sticky top-[62px] z-10 py-3 pl-6 text-left text-sm font-medium dark:text-white"
          scope="colgroup"
        >
          <div className="flex items-center gap-4">
            {props.icon && <ProductIcon icon={props.icon} color="green" />}
            <h4 className="m-0 text-base font-normal">{category.title}</h4>
          </div>
        </th>
        <td className="border-b-2 border-scale-700 bg-scale-50 dark:bg-scale-200 px-6 py-5 free"></td>
        <td className="border-b-2 border-scale-700 bg-scale-50 dark:bg-scale-200 px-6 py-5 pro"></td>
        <td className="border-b-2 border-scale-700 bg-scale-50 dark:bg-scale-200 px-6 py-5 team"></td>
        <td className="border-b-2 border-scale-700 bg-scale-50 dark:bg-scale-200 px-6 py-5 enterprise"></td>
      </tr>

      {category.features.map((feat: any, i: number) => {
        return (
          <Fragment key={feat.title}>
            <tr className="divide-scale-600 dark:divide-scale-400" key={i}>
              <th
                className={`text-scale-1200 flex items-center px-6 py-5 last:pb-24 text-left text-xs font-normal dark:text-white `}
                scope="row"
              >
                <span>{feat.title}</span>
                {feat.tooltips?.main && (
                  <span
                    className="text-scale-900 hover:text-scale-1200 ml-2 cursor-pointer transition-colors"
                    data-tip={feat.tooltips.main}
                  >
                    <IconHelpCircle size={14} strokeWidth={2} />
                  </span>
                )}
              </th>

              {Object.entries(feat.plans).map((entry: any, i) => {
                const planName = entry[0]
                const planValue = entry[1]

                return (
                  <td
                    key={i}
                    className={[
                      `px-6 tier-${planName}`,
                      typeof planValue === 'boolean' ? 'text-center' : '',
                    ].join(' ')}
                  >
                    {typeof planValue === 'boolean' && planValue === true ? (
                      <IconPricingIncludedCheck plan={planValue} />
                    ) : typeof planValue === 'boolean' && planValue === false ? (
                      <div className="text-scale-900">
                        <IconPricingMinus plan={planValue} />
                      </div>
                    ) : (
                      <span className="text-scale-1200 text-xs dark:text-white flex items-center gap-3">
                        {feat.tooltips?.[planName] && (
                          <span
                            className="shrink-0 hover:text-scale-300 cursor-pointer transition-colors"
                            data-tip={feat.tooltips[planName]}
                          >
                            <IconPricingInfo />
                          </span>
                        )}
                        {planValue}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
            {i === category.features.length - 1 && (
              <div className="my-16 bg-green-400 border-none"></div>
            )}
          </Fragment>
        )
      })}
      <ReactTooltip effect={'solid'} className="!max-w-[320px] whitespace-pre-line" />
    </>
  )
}

export const PricingTableRowMobile = (props: any) => {
  const category = props.category
  const plan = props.plan

  return (
    <>
      <table className="mt-8 w-full" id={`${props.sectionId}-mobile`}>
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
                  {typeof feat.plans[plan] === 'boolean' && feat.plans[plan] === true ? (
                    <div className="inline-block">
                      <IconPricingIncludedCheck plan={plan} />
                    </div>
                  ) : typeof feat.plans[plan] === 'boolean' && feat.plans[plan] === false ? (
                    <div className="inline-block">
                      <IconPricingMinus plan={plan} />
                    </div>
                  ) : (
                    <span className="text-scale-1200 block text-sm">{feat.plans[plan]}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <ReactTooltip effect={'solid'} className="!max-w-[320px] whitespace-pre-line" />
    </>
  )
}
