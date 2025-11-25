import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { BASE_PATH } from 'lib/constants'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns'

export const IndexAdvisorNotice = () => {
  return (
    <div className="px-6">
      <Admonition showIcon={false} type="tip" className="relative overflow-hidden mb-4">
        <div className="absolute -inset-16 z-0 opacity-50">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt="Index Advisor"
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt="Index Advisor"
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2 py-1">
          <div className="flex flex-col gap-y-0.5">
            <div className="flex flex-col gap-y-2 items-start">
              <p className="text-sm font-medium">Index Advisor</p>
            </div>
            <p className="text-sm text-foreground-lighter text-balance">
              Enable the Index Advisor plugin to get recommendations and optimizations on your
              queries.
            </p>
          </div>
          <Button type="primary">Enable</Button>
        </div>
      </Admonition>
    </div>
  )
}
