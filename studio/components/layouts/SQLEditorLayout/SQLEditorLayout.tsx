import { FC, ReactNode, useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore, withAuth } from 'hooks'
import Error from 'components/ui/Error'
import { useSqlEditorStore, SqlEditorContext } from 'localStores/sqlEditor/SqlEditorStore'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import SQLEditorMenu from './SQLEditorMenu'

interface Props {
  title: string
  children: ReactNode
}

const SQLEditorLayout: FC<Props> = ({ title, children }) => {
  const { ui, content, meta } = useStore()
  const { profile: user } = ui

  const sqlEditorStore = useSqlEditorStore(ui.selectedProject?.ref, meta)

  useEffect(() => {
    if (sqlEditorStore) {
      // this calls content.load() for us, as well as loading tabs
      sqlEditorStore.loadRemotePersistentData(content, user?.id)
    }
  }, [sqlEditorStore])

  return (
    <SqlEditorContext.Provider value={sqlEditorStore}>
      {content.error ? (
        <ProjectLayout>
          <Error error={content.error} />
        </ProjectLayout>
      ) : (
        <ProjectLayout
          isLoading={content.isLoading || sqlEditorStore === null}
          title={title || 'SQL'}
          product="SQL Editor"
          productMenu={<SQLEditorMenu />}
        >
          {children}
        </ProjectLayout>
      )}
    </SqlEditorContext.Provider>
  )
}

export default withAuth(observer(SQLEditorLayout))
