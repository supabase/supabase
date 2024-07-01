import { MetaFunction } from '@remix-run/react'
import NewPage from 'pages/new'

export const meta: MetaFunction = () => {
  return [{ title: 'New Organization | Supabase' }]
}

export default NewPage
