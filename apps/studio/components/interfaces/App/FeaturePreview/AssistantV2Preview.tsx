import Image from 'next/image'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import { detectOS } from 'lib/helpers'

export const AssistantV2Preview = () => {
  const os = detectOS()
  const { ref } = useParams()

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-foreground-light text-sm mb-4">
        We're changing the way our AI Assistant integrates with the dashboard by making it shared
        and accessible universally across the whole dashboard. This hopes to make using the
        Assistant as a supporting tool more seamless while you build your project.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/assistant-v2.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <p className="text-foreground-light text-sm mb-4">
        The Assistant will also be automatically provided with contexts depending on where you are
        in the dashboard to generate more relevant and higher quality outputs. You may also ask for
        insights on your own data apart from help with SQL and Postgres!
      </p>
      <p className="text-foreground-light text-sm mb-4">
        We believe that this should further lower the barrier of working with databases especially
        if you're not well acquainted with Postgres (yet!), so please do feel free to let us know
        what you think in the attached GitHub discussion above!
      </p>
      <div className="flex flex-col gap-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Add a button in the top navigation bar where you can access the AI Assistant from anywhere in the dashboard`}
            />
          </li>
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Add a keyboard shortcut (${os === 'macos' ? 'Cmd' : 'Ctrl'} + I) that can also open the Assistant from anywhere in the dashboard`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
