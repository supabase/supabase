import { Outlet } from '@remix-run/react'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'

export default function Project() {
  return (
    <ProjectLayoutWithAuth>
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </ProjectLayoutWithAuth>
  )
}
