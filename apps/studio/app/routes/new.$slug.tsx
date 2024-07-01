import { MetaFunction } from '@remix-run/react'
import NewProjectPage from 'pages/new/[slug]'

export const meta: MetaFunction = () => {
  return [{ title: 'New Project | Supabase' }]
}

export default NewProjectPage
