import { MetaFunction } from '@remix-run/react'
import TableEditorPage from 'pages/project/[ref]/editor/[id]'

export const meta: MetaFunction = () => {
  return [{ title: 'Table | Supabase' }]
}

export default TableEditorPage
