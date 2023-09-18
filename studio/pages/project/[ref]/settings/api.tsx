import { observer, useLocalObservable } from 'mobx-react-lite'
import { createContext } from 'react'

import { useParams } from 'common/hooks'
import ServiceList from 'components/interfaces/Settings/API/ServiceList'
import { SettingsLayout } from 'components/layouts'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { IconAlertCircle } from 'ui'

export const PageContext: any = createContext(null)

const ApiSettings: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { ui, meta } = useStore()
  const { project } = useProjectContext()
  const isActive = useIsProjectActive()

  // [Joshen] Will need to deprecate this
  const PageState: any = useLocalObservable(() => ({
    project: null,
    projectRef: ref,
    meta: null,
  }))

  PageContext.meta = meta
  PageContext.project = project
  if (meta) PageState.meta = meta

  return (
    <PageContext.Provider value={PageState}>
      <div className="flex flex-col gap-8 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 xl:px-24 2xl:px-32">
        {isActive ? (
          <ServiceList />
        ) : (
          <div>
            <h3 className="mb-6 text-xl text-scale-1200">API Settings</h3>
            <div className="flex items-center justify-center rounded border border-scale-400 bg-scale-300 p-8">
              <IconAlertCircle strokeWidth={1.5} />
              <p className="text-sm text-scale-1100 ml-2">
                API settings are unavailable as the project is not active
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContext.Provider>
  )
}

ApiSettings.getLayout = (page) => <SettingsLayout title="API Settings">{page}</SettingsLayout>

export default observer(ApiSettings)
