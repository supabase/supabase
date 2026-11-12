import { ProjectsApp } from '../shell/ProjectsApp'
import { mountSurface } from './mount'

mountSurface('projects', ({ initial, initialRoute, registerRoute }) => (
  <ProjectsApp initial={initial} initialRoute={initialRoute} registerRoute={registerRoute} />
))
