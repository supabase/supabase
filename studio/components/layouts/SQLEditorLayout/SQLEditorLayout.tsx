import { FC, ReactNode, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import Error from 'components/ui/Error'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
// import SQLEditorMenu from './SQLEditorMenu'
import SQLEditorMenuOld from './SQLEditorMenuOld'

interface Props {
  title: string
  children: ReactNode
}

const SQLEditorLayout: FC<Props> = ({ title, children }) => {
  const { content } = useStore()
  const { isInitialized, isLoading, error } = content

  const [loaded, setLoaded] = useState(isInitialized)

  useEffect(() => {
    content.load()
  }, [])

  useEffect(() => {
    if (!isLoading && !loaded) {
      setLoaded(true)
    }
  }, [isLoading])

  if (error) {
    return (
      <ProjectLayout>
        <Error error={error} />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      isLoading={!loaded}
      title={title || 'SQL'}
      product="SQL Editor"
      productMenu={<SQLEditorMenuOld />}
    >
      {children}
    </ProjectLayout>
  )
}

export default observer(SQLEditorLayout)
