import Image from 'next/image'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import { detectOS } from 'lib/helpers'

export const FunctionsAssistantPreview = () => {
  const os = detectOS()
  const { ref } = useParams()

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-foreground-light text-sm mb-4">
        We're providing an additional alternative UX to creating database functions through the
        dashboard with the integration of our AI Assistant that you might have seen in the Auth
        Policies section.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/functions-assistant.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <p className="text-foreground-light text-sm mb-4">
        This preview also shares an improved Assistant interface where you may provide the Assistant
        with contexts in hopes to generate more relevant and higher quality outputs. Contexts that
        you may provide include specific schemas, and / or specific tables from your database.
      </p>
      <p className="text-foreground-light text-sm mb-4">
        We'd hope to use this as a consistent pattern throughout the dashboard eventually if this
        feature preview proves itself to benefit most of our users, so as usual please do feel free
        to let us know what you think if the attached GitHub discussion above!
      </p>
      <div className="flex flex-col gap-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Add a button beside the "Create new function" button on the [Database Functions page](/project/${ref}/database/functions) that will open up a code editor paired with a contextualized AI assistant in a side panel.`}
            />
          </li>
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Add a keyboard shortcut (${os === 'macos' ? 'Cmd' : 'Ctrl'} + I) that will open the Assistant in an uncontextualized mode, along with a quick SQL Editor that you can run queries with from anywhere in the dashboard`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
