import { IconHelpCircle } from 'ui'
import ProductIcon from 'components/ProductIcon'
import React, { Fragment } from 'react'
import { IconPricingIncludedCheck, IconPricingInfo, IconPricingMinus } from './PricingIcons'

export const PricingTableRowDesktop = (props: any) => {
  const category = props.category

  return (
    <>
      <tr
        className="divide-border -scroll-mt-5"
        style={{ borderTop: 'none' }}
        id={`${props.sectionId}-desktop`}
      >
        <th
          className="bg-background text-foreground sticky top-[108px] xl:top-[84px] z-10 py-3 pl-6 text-left text-sm font-medium"
          scope="colgroup"
        >
          <div className="flex items-center gap-4">
            {props.icon && <ProductIcon icon={props.icon} color="green" />}
            <h4 className="m-0 text-base font-normal">{category.title}</h4>
          </div>
        </th>
        <td className="bg-background px-6 py-5 free"></td>
        <td className="bg-background px-6 py-5 pro"></td>
        <td className="bg-background px-6 py-5 team"></td>
        <td className="bg-background px-6 py-5 enterprise"></td>
      </tr>

      {category.features.map((feat: any, i: number) => {
        return (
          <Fragment key={feat.title}>
            <tr className="divide-border" key={i}>
              <th
                className={`text-foreground flex items-center px-6 py-5 last:pb-24 text-left text-xs font-normal `}
                scope="row"
              >
                <span>{feat.title}</span>
                {feat.tooltips?.main && (
                  <span
                    className="text-muted hover:text-foreground ml-2 cursor-pointer transition-colors"
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
                      `pl-6 pr-2 tier-${planName}`,
                      typeof planValue === 'boolean' ? 'text-center' : '',
                    ].join(' ')}
                  >
                    {typeof planValue === 'boolean' && planValue === true ? (
                      <IconPricingIncludedCheck plan={planValue} />
                    ) : typeof planValue === 'boolean' && planValue === false ? (
                      <div className="text-muted">
                        <IconPricingMinus plan={planValue} />
                      </div>
                    ) : (
                      <div className="text-foreground text-xs flex flex-col justify-center">
                        <span className="flex items-center gap-2">
                          {feat.tooltips?.[planName] && (
                            <span
                              className="shrink-0 hover:text-background-overlay-default cursor-pointer transition-colors"
                              data-tip={feat.tooltips[planName]}
                            >
                              <IconPricingInfo />
                            </span>
                          )}
                          {typeof planValue === 'string' ? planValue : planValue[0]}
                        </span>
                        {typeof planValue !== 'string' && (
                          <span className="text-lighter leading-4">{planValue[1]}</span>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
            {i === category.features.length - 1 && (
              <tr className="my-16 bg-green-400 border-none"></tr>
            )}
          </Fragment>
        )
      })}
    </>
  )
}

export const PricingTableRowMobile = (props: any) => {
  const category = props.category
  const plan = props.plan

  return (
    <table className="mt-8 w-full -scroll-mt-5" id={`${props.sectionId}-mobile`}>
      <caption className="bg-background border-default border-t px-4 py-3 text-left text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">
          {category.icon ? <ProductIcon icon={props.icon} /> : null}
          <span className="text-foreground font-normal">{category.title}</span>
        </span>
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
      <tbody className="divide-border-default divide-y">
        {category.features.map((feat: any, i: number) => {
          return (
            <tr key={i} className="border-default border-t">
              <th
                className="text-foreground-light px-4 py-3 text-left text-sm font-normal"
                scope="row"
              >
                <p>{feat.title}</p>
              </th>
              <td className="py-3 pr-4 text-right">
                {typeof feat.plans[plan] === 'boolean' && feat.plans[plan] === true ? (
                  <span className="inline-block">
                    <IconPricingIncludedCheck plan={plan} />
                  </span>
                ) : typeof feat.plans[plan] === 'boolean' && feat.plans[plan] === false ? (
                  <span className="inline-block">
                    <IconPricingMinus plan={plan} />
                  </span>
                ) : (
                  <span className="text-foreground flex flex-col text-sm">
                    <span>
                      {typeof feat.plans[plan] === 'string'
                        ? feat.plans[plan]
                        : feat.plans[plan][0]}
                    </span>
                    {typeof feat.plans[plan] !== 'string' && (
                      <span className="text-lighter leading-5">{feat.plans[plan][1]}</span>
                    )}
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
