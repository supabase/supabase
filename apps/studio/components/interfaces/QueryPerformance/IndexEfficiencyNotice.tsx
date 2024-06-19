import { AlertCircle, CheckCircle } from 'lucide-react'

import { AccordionTrigger } from '@ui/components/shadcn/ui/accordion'
import { useParams } from 'common'
import { AccordionContent_Shadcn_, AccordionItem_Shadcn_, Accordion_Shadcn_ } from 'ui'
import { PRESET_CONFIG } from '../Reports/Reports.constants'
import { Presets } from '../Reports/Reports.types'
import { queriesFactory } from '../Reports/Reports.utils'

interface IndexEfficiencyNoticeProps {
  isLoading: boolean
}

// [Joshen] Currently not used, might be deprecated - just double checking first
export const IndexEfficiencyNotice = ({ isLoading }: IndexEfficiencyNoticeProps) => {
  const { ref: projectRef } = useParams()
  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, projectRef ?? 'default')

  const queryHitRate = hooks.queryHitRate()
  const indexHitRate = queryHitRate.data?.[0]?.ratio
  const tableHitRate = queryHitRate.data?.[1]?.ratio
  const showIndexWarning =
    indexHitRate && tableHitRate && (indexHitRate <= 0.99 || tableHitRate <= 0.99)

  const checkAlert = <CheckCircle strokeWidth={2} size={16} className="text-brand" />
  const warnAlert = <AlertCircle strokeWidth={2} size={16} className="text-warning" />
  const dangerAlert = <AlertCircle strokeWidth={2} size={16} className="text-destructive" />

  return (
    <Accordion_Shadcn_ type="single" collapsible>
      <AccordionItem_Shadcn_ value="1" className="border-none">
        <AccordionTrigger className="p-4 bg-surface-100 rounded border [&[data-state=open]]:rounded-b-none hover:no-underline">
          <div className="flex flex-row gap-x-2 items-center">
            <span className="text-sm">Index Efficiency</span>
            {showIndexWarning ? warnAlert : checkAlert}
          </div>
        </AccordionTrigger>
        <AccordionContent_Shadcn_ className="p-4 bg-surface-100 rounded-b border border-t-0 [&>div]:pb-0">
          {!isLoading && queryHitRate && (
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-row gap-4">
                <div className="w-1/2 bg-slate-200 rounded-md p-4">
                  <p>Index Hit Rate</p>
                  <div className="flex items-center gap-x-3">
                    {indexHitRate >= 0.99
                      ? checkAlert
                      : indexHitRate >= 0.95
                        ? warnAlert
                        : dangerAlert}
                    <div className="flex items-baseline">
                      <span className="text-3xl">
                        {queryHitRate?.data && (queryHitRate?.data[0]?.ratio * 100).toFixed(2)}
                      </span>
                      <span className="text-xl">%</span>
                    </div>
                  </div>
                </div>

                <div className="w-1/2 bg-slate-200 rounded-md p-4">
                  {queryHitRate?.data![1]?.name == 'table hit rate' && 'Table Hit Rate'}
                  <div className="flex items-center gap-2">
                    {tableHitRate >= 0.99
                      ? checkAlert
                      : tableHitRate >= 0.95
                        ? warnAlert
                        : dangerAlert}
                    <div className="flex items-baseline">
                      <span className="text-3xl">
                        {queryHitRate?.data && (queryHitRate?.data[1]?.ratio * 100).toFixed(2)}
                      </span>
                      <span className="text-xl">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-foreground-light text-sm max-w-2xl">
                For best performance, ensure that the cache hit rate ratios above 99%. <br />{' '}
                Consider upgrading to an instance with more memory if the ratios dip below 95%.
              </p>
            </div>
          )}
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
    </Accordion_Shadcn_>
  )
}
