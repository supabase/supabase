import { MetaFunction } from '@remix-run/react'
import ProjectPage from 'pages/project/[ref]'

export const meta: MetaFunction = () => {
  return [{ title: 'Project | Supabase' }]
}

export default ProjectPage
