import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'

const APISidePanelPreview = () => {
  const { ref } = useParams()

  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm">
        Get building with your client application faster with your Project's API documentation now
        available on any page across the dashboard. Get contextualized code snippets based on what
        you're viewing in the dashboard - so less thinking, more building.
      </p>
      <img
        src={`${BASE_PATH}/img/previews/api-docs-preview.png`}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">
          Enabling this preview will involve the following changes to the UI:
        </p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            The original API documentation page will be replaced by a global API documentation side
            panel that can be accessed anywhere while in a project. (Still via the left navigation
            bar)
          </li>
          <li>
            <Markdown
              className="text-foreground-light"
              content={`The GraphiQL interface will be shifted to the Database section of the dashboard [here](/project/${ref}/database/graphiql).`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}

export default APISidePanelPreview
