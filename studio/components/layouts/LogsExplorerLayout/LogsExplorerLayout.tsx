import React from 'react'
import BaseLayout from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { IconList } from '@supabase/ui'
import FunctionsNav from '../interfaces/Settings/Logs/LogsNav'
import LogsNavigation from 'components/interfaces/Settings/Logs/LogsNavigation'

const PageLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <BaseLayout>
      <div className="h-full flex flex-col flex-grow">
        <div
          className="
            pt-10
            pb-2
            w-full mx-auto

            transition-all

            px-5
            lg:px-20
            xl:px-24
            1xl:px-28
            2xl:px-32

            flex flex-col
            gap-8
        "
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 bg-brand-300 border border-brand-600 rounded text-brand-900
            flex items-center justify-center
          "
            >
              <IconList size={14} strokeWidth={3} />
            </div>
            <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
          </div>
          <LogsNavigation />
        </div>
        <div
          // weird repetitive styling
          className="
            h-full flex flex-col flex-grow

            w-full mx-auto

            transition-all

            px-5
            lg:px-20
            xl:px-24
            1xl:px-28
            2xl:px-32
        "
        >
          {children}
        </div>
      </div>
    </BaseLayout>
  )
}

export default withAuth(observer(PageLayout))
