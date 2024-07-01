import { MetaFunction } from '@remix-run/react'
import EditorPage from 'pages/project/[ref]/editor'

export const meta: MetaFunction = () => {
  return [{ title: 'Table Editor | Supabase' }]
}

export default EditorPage
