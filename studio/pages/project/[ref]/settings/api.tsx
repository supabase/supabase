import { createContext } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import ServiceList from 'components/interfaces/Settings/API/ServiceList'

export const PageContext: any = createContext(null)

const ApiSettings: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

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
      <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
        <ServiceList projectRef={ref as string} />
      </div>
    </PageContext.Provider>
  )
}

ApiSettings.getLayout = (page) => <SettingsLayout title="API Settings">{page}</SettingsLayout>

export default observer(ApiSettings)
