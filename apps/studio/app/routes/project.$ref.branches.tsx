import { MetaFunction } from '@remix-run/react'
import BranchesPage from 'pages/project/[ref]/branches'

export const meta: MetaFunction = () => {
  return [{ title: 'Branches | Supabase' }]
}

export default BranchesPage
