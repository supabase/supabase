import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

const APISidePanelPreview = () => {
  const { ref } = useParams()

  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm mb-4">
        Your project's API documentation will be available on any page across the dashboard. <br />
        Get contextualized code snippets based on what you're viewing in the dashboard. Less
        thinking, more building.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/api-docs-preview.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Replace the original API documentation page with a global API documentation side panel
            that can be accessed anywhere while in a project.
          </li>
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Move the GraphiQL interface the Database section of the dashboard [here](/project/${ref}/database/graphiql).`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}

export default APISidePanelPreview
