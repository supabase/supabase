import { getRowEditorHeader } from './HeaderTitle.utils'
import type { RowEditorMode } from './RowEditor.types'

interface HeaderTitleProps {
  mode: RowEditorMode
  tableName?: string
}

export const HeaderTitle = ({ mode, tableName }: HeaderTitleProps) => {
  return (
    <span>
      {getRowEditorHeader(mode)}
      {tableName && <code className="text-sm!">{tableName}</code>}
    </span>
  )
}
