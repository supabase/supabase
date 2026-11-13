import { dataOperations } from 'surfaces/contract'

import { decodeToolResult } from '../host/tool-data-port'
import { ProjectCardScreen } from '../shell/ProjectCardScreen'
import { mountToolView } from './mount'

// Rendered from create_project: the result is the new project, as the model sees it.
mountToolView('project-card', {
  decode: (result) => dataOperations.getProject.output.parse(decodeToolResult(result)),
  preview: import.meta.env.DEV
    ? (name) =>
        import('../preview/project-card').then(({ previewProjectCard }) => previewProjectCard(name))
    : undefined,
  render: ({ initial, data, agent }) => (
    <div className="p-px">
      <ProjectCardScreen initial={initial} data={data} agent={agent} />
    </div>
  ),
})
