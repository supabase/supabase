import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { IconCode } from '@supabase/ui'

import { useStore, withAuth } from 'hooks'
import FunctionsNav from './FunctionsNav'
import BaseLayout from 'components/layouts'

const FunctionsLayout = ({ children }: { children?: React.ReactNode }) => {
  const { functions, ui } = useStore()
  const router = useRouter()

  const { id, ref } = router.query

  useEffect(() => {
    if (ui.selectedProjectRef) {
      functions.load()
    }
  }, [ui.selectedProjectRef])

  const item = id ? functions.byId(id) : null
  const name = item?.name || ''

  const hasFunctions = functions.list().length > 0
  const centered = !hasFunctions

  return (
    <BaseLayout isLoading={!functions.isLoaded}>
      {centered ? (
        <>
          <div className="mx-auto max-w-5xl py-24 px-5">
            <div
              className="flex 
            flex-col 
            gap-y-4
            xl:flex-row 
            item-center 
            justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'w-6 h-6 bg-brand-300 border border-brand-600 rounded',
                    'text-brand-900 flex items-center justify-center',
                  ].join(' ')}
                >
                  <IconCode size={14} strokeWidth={3} />
                </div>
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl text-scale-1200">Edge Functions</h1>
                  <p className="text-scale-1000 mt-1">Beta</p>
                </div>
              </div>
            </div>

            {children}
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col flex-grow py-6">
          <div
            className={[
              'w-full mx-auto transition-all flex flex-col',
              'px-5 lg:px-16 xl:px-24 1xl:px-28 2xl:px-32 gap-4',
            ].join(' ')}
          >
            <div className="flex flex-col gap-y-4 xl:flex-row item-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'w-6 h-6 bg-brand-300 border border-brand-600 rounded',
                    'text-brand-900 flex items-center justify-center',
                  ].join(' ')}
                >
                  <IconCode size={14} strokeWidth={3} />
                </div>

                <div className="flex items-center space-x-4">
                  <Link href={`/project/${ref}/functions`}>
                    <h1 className="transition-colors text-2xl text-scale-1200 cursor-pointer hover:text-scale-1100">
                      Edge Functions
                    </h1>
                  </Link>
                  <p className="text-scale-1000 mt-1">Beta</p>
                </div>

                {name && (
                  <>
                    <span className="text-scale-800 dark:text-scale-700">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        shapeRendering="geometricPrecision"
                      >
                        <path d="M16 3.549L7.12 20.600"></path>
                      </svg>
                    </span>
                    <h5 className="text-2xl text-scale-1200">{name}</h5>
                  </>
                )}
              </div>
            </div>
            {item && <FunctionsNav item={item} />}
          </div>
          <div
            className={[
              'h-full flex flex-col flex-grow w-full mx-auto transition-all',
              'px-5 lg:px-16 xl:px-24 1xl:px-28 2xl:px-32 gap-4',
            ].join(' ')}
          >
            {children}
          </div>
        </div>
      )}
    </BaseLayout>
  )
}

export default withAuth(observer(FunctionsLayout))
