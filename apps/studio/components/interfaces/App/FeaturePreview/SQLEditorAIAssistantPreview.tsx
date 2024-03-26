import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const SQLEditorAIAssistantPreview = () => {
  const { ref } = useParams()

  return (
    <div className="space-y-2">
      <div className="mb-4 flex flex-col gap-y-2">
        <Markdown
          className="text-foreground-light max-w-full"
          content="When using the [SQL Editor](http://supabase.com/project/_/sql) you'll have access to a new and improved conversational AI Assistant which you can use to help you write your queries."
        />
        <Markdown
          className="text-foreground-light max-w-full"
          content={`Let our AI Assistant handle the SQL while you focus on building your app.`}
        />
      </div>
      <Image
        src={`${BASE_PATH}/img/previews/rls-ai-assistant-preview.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Replace the existing single-input UI with a side panel where you can have a full, contextual conversation.`}
            />
          </li>
          <li>
            <Markdown
              className="text-foreground-light"
              content={`The Assistant will iteratively generate SQL from your natural language prompts.`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
