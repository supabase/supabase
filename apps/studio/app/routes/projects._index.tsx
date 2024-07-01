import { MetaFunction } from '@remix-run/react'
import ProjectsPage from 'pages/projects'

export const meta: MetaFunction = () => {
  return [{ title: 'Projects | Supabase' }]
}

export default ProjectsPage
