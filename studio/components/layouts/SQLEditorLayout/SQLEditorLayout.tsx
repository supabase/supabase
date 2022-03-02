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

  useEffect(() => {
    content.load()
  }, [])

  return content.error ? (
    <ProjectLayout>
      <Error error={content.error} />
    </ProjectLayout>
  ) : (
    <ProjectLayout
      isLoading={content.isLoading}
      title={title || 'SQL'}
      product="SQL Editor"
      productMenu={<SQLEditorMenuOld />}
    >
      {children}
    </ProjectLayout>
  )
}

export default observer(SQLEditorLayout)
