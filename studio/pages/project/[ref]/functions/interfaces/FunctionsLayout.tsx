import BaseLayout from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'
import { IconCode, IconSlash, Tabs } from '@supabase/ui'
import { Tab } from '@headlessui/react'
import FunctionsNav from '../interfaces/FunctionsNav'
import React from 'react'

const PageLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <BaseLayout>
      <div
        className="
            py-10
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
            <IconCode size={14} strokeWidth={3} />
          </div>
          <h1 className="text-2xl text-scale-1200">Functions</h1>
        </div>

        {children}
      </div>
    </BaseLayout>
  )
}

export default withAuth(observer(PageLayout))
