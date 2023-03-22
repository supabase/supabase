import { createContext } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'

import { useParams, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import ServiceList from 'components/interfaces/Settings/API/ServiceList'

export const PageContext: any = createContext(null)

const ApiSettings: NextPageWithLayout = () => {
  const { ref } = useParams()

  const { meta, ui } = useStore()
  const project = ui.selectedProject

  const PageState: any = useLocalObservable(() => ({
    project: null,
    projectRef: ref,
    meta: null,
  }))

  PageContext.meta = meta
  PageContext.project = project

  // load schemas
  const load = async () => {
    await meta.schemas.load()
  }

  if (meta) {
    PageState.meta = meta
    load()
  }

  return (
    <PageContext.Provider value={PageState}>
      <div className="flex flex-col gap-8 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 xl:px-24 2xl:px-32">
        <ServiceList />
      </div>
    </PageContext.Provider>
  )
}

ApiSettings.getLayout = (page) => <SettingsLayout title="API Settings">{page}</SettingsLayout>

export default observer(ApiSettings)
