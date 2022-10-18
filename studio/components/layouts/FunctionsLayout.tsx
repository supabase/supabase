import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useEffect, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { IconCode } from 'ui'

import { checkPermissions, useStore, withAuth } from 'hooks'
import FunctionsNav from '../interfaces/Functions/FunctionsNav'
import BaseLayout from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  title?: string
  children?: ReactNode
}

const FunctionsLayout: FC<Props> = ({ title, children }) => {
  const { functions, ui } = useStore()
  const router = useRouter()

  const { id, ref } = router.query

  useEffect(() => {
    if (ui.selectedProjectRef) functions.load()
  }, [ui.selectedProjectRef])

  const canReadFunctions = checkPermissions(PermissionAction.FUNCTIONS_READ, '*')
  if (!canReadFunctions) {
    return (
      <BaseLayout title={title || 'Edge Functions'} product="Edge Functions">
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's edge functions" />
        </main>
      </BaseLayout>
    )
  }

  const item = id ? functions.byId(id) : null
  const name = item?.name || ''

  const hasFunctions = functions.list().length > 0
  const centered = !hasFunctions

  return (
    <BaseLayout
      isLoading={!functions.isLoaded}
      title={title || 'Edge Functions'}
      product="Edge Functions"
    >
      {centered ? (
        <>
          <div className="mx-auto max-w-5xl py-24 px-5">
            <div
              className="item-center 
            flex 
            flex-col
            justify-between 
            gap-y-4 
            xl:flex-row"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'h-6 w-6 rounded border border-brand-600 bg-brand-300',
                    'flex items-center justify-center text-brand-900',
                  ].join(' ')}
                >
                  <IconCode size={14} strokeWidth={3} />
                </div>
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl text-scale-1200">Edge Functions</h1>
                  <p className="mt-1 text-scale-1000">Beta</p>
                </div>
              </div>
            </div>

            {children}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-grow flex-col py-6">
          <div
            className={[
              'mx-auto flex w-full flex-col transition-all',
              '1xl:px-28 gap-4 px-5 lg:px-16 xl:px-24 2xl:px-32',
            ].join(' ')}
          >
            <div className="item-center flex flex-col justify-between gap-y-4 xl:flex-row">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'h-6 w-6 rounded border border-brand-600 bg-brand-300',
                    'flex items-center justify-center text-brand-900',
                  ].join(' ')}
                >
                  <IconCode size={14} strokeWidth={3} />
                </div>

                <div className="flex items-center space-x-4">
                  <Link href={`/project/${ref}/functions`}>
                    <h1 className="cursor-pointer text-2xl text-scale-1200 transition-colors hover:text-scale-1100">
                      Edge Functions
                    </h1>
                  </Link>
                  <p className="mt-1 text-scale-1000">Beta</p>
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
              'mx-auto flex h-full w-full flex-grow flex-col transition-all',
              '1xl:px-28 gap-4 px-5 lg:px-16 xl:px-24 2xl:px-32',
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
