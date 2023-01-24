import { IconHelpCircle, IconInfo, IconX, IconXCircle, Modal } from 'ui'
import ProductIcon from 'components/ProductIcon'
import React, { Fragment, useState } from 'react'
import ReactTooltip from 'react-tooltip'

export const Check = () => (
  <svg className="-ml-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="25" fill="none">
    <path
      fill="#3ECF8E"
      fillRule="evenodd"
      d="M12 21.212a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-.708-6.414 4.463-4.463-.707-.708-4.11 4.11-1.986-1.986-.707.707 2.34 2.34h.707Z"
      clipRule="evenodd"
    />
  </svg>
)

const IncludedCheck = (props: any) => (
  <span className="mx-auto">
    <Check />
    <span className="sr-only">Included in {props.tier}</span>
  </span>
)

const Minus = (props: any) => (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      className="text-scale-700"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9 18A9 9 0 1 0 9 0a9 9 0 0 0 0 18ZM5.534 9.534h6.804v-1H5.534v1Z"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Not included in {props.tier}</span>
  </>
)

const InfoIcon = () => (
  <>
    <svg
      className="text-scale-900 -ml-0.5"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.724-11.97c0 .463-.328.764-.774.764-.436 0-.773-.3-.773-.764s.337-.783.774-.783c.445 0 .773.319.773.783Zm1.455 6.194H9.877v-.855h1.628v-2.956H9.877v-.828h2.674v3.784h1.628v.855Z"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Info</span>
  </>
)

export const PricingTableRowDesktop = (props: any) => {
  const category = props.category

  return (
    <>
      <tr
        className="divide-scale-600 dark:divide-scale-400 bg-scale-200"
        style={{ borderTop: 'none' }}
      >
        <th
          className="border-b-2 border-scale-600 bg-scale-200 bg-scale-50 dark:bg-scale-200 text-scale-1200 sticky top-[62px] z-10 py-3 pl-6 text-left text-sm font-medium dark:text-white"
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

              {Object.entries(feat.tiers).map((entry: any, i) => {
                const tierName = entry[0]
                const tierValue = entry[1]

                return (
                  <td
                    key={i}
                    className={[
                      `px-6 tier-${tierName}`,
                      typeof tierValue === 'boolean' ? 'text-center' : '',
                    ].join(' ')}
                  >
                    {typeof tierValue === 'boolean' && tierValue === true ? (
                      <IncludedCheck tier={tierValue} />
                    ) : typeof tierValue === 'boolean' && tierValue === false ? (
                      <div className="text-scale-900">
                        <Minus tier={tierValue} />
                      </div>
                    ) : (
                      <span className="text-scale-1200 text-xs dark:text-white flex items-center gap-3">
                        {feat.tooltips?.[tierName] && (
                          <span
                            className="shrink-0 hover:text-scale-300 cursor-pointer transition-colors"
                            data-tip={feat.tooltips[tierName]}
                          >
                            <InfoIcon />
                          </span>
                        )}
                        {tierValue}
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
