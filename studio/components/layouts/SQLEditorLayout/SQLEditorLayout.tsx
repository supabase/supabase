import { withAuth } from 'hooks'
import { observer } from 'mobx-react-lite'
import { FC, ReactNode, useMemo } from 'react'
import { ProjectLayoutNonBlocking } from '../ProjectLayout/ProjectLayout'
import SQLEditorMenu from './SQLEditorMenu'

interface Props {
  title: string
  children: ReactNode
}

const SQLEditorLayout: FC<Props> = ({ title, children }) => {
  const productMenu = useMemo(() => <SQLEditorMenu key="sql-editor-menu" />, [])

  return (
    <ProjectLayoutNonBlocking title={title || 'SQL'} product="SQL Editor" productMenu={productMenu}>
      {children}
    </ProjectLayoutNonBlocking>
  )
}

export default withAuth(observer(SQLEditorLayout))
