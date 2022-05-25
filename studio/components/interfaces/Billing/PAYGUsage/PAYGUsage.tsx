import React, { FC } from 'react'
import dayjs from 'dayjs'
import { Typography } from '@supabase/ui'

import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import { ChargeableProduct, PaygStats, ProductFeature } from './PAYGUsage.types'
import { deriveProductCost } from './PAYGUsage.utils'
import { chargeableProducts } from './PAYGUsage.constants'
import { DATE_FORMAT } from 'lib/constants'

interface Props {
  paygStats: PaygStats,
  dateRange: {
    period_start: {date: string, time_period: string}
    period_end: {date: string, time_period: string}
    interval: string
  }
}

const PAYGUsage: FC<Props> = ({ paygStats, dateRange }) => {
  const startDate = dateRange.period_start.date ?? dayjs().utc().startOf('month').format(DATE_FORMAT)
  const endDate =  dateRange.period_end.date ?? dayjs().utc().endOf('month').format(DATE_FORMAT)

  return (
    <div className="flex flex-col">
      {chargeableProducts.map((product: ChargeableProduct) => {
        const productCost = deriveProductCost(paygStats, product)

        return (
          <div
            key={product.title}
            className="rounded overflow-hidden border border-panel-border-light dark:border-panel-border-dark mb-8"
          >
            <div className="w-full bg-panel-body-light dark:bg-panel-body-dark">
              <div className="bg-panel-header-light dark:bg-panel-header-dark">
                <div className="px-6 py-3 flex items-center justify-between rounded overflow-hidden">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      <img width={'16'} src={product.iconUrl} />
                    </div>
                    <Typography.Title level={5} className="font-medium mb-0">
                      {product.title}
                    </Typography.Title>
                  </div>
                  {product.title !== 'Authentication' && (
                    <div className="flex items-center space-x-1">
                      <Typography.Text className="opacity-50">$</Typography.Text>
                      <Typography.Title className="font-medium m-0" level={4}>
                        {productCost.toFixed(3)}
                      </Typography.Title>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                {product.features.map((feature: ProductFeature) => (
                  <div
                    key={feature.title}
                    className="px-6 py-3 relative border-t border-panel-border-light dark:border-panel-border-dark"
                  >
                    <ChartHandler
                      hideChartType
                      label={`${feature.title} for ${dayjs().format('MMMM')}`}
                      attribute={feature.attribute}
                      provider="daily-stats"
                      startDate={startDate}
                      endDate={endDate}
                      interval="1d"
                      highlight="maximum"
                      defaultChartStyle="bar"
                      customDateFormat={'MMM D, YYYY'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PAYGUsage
