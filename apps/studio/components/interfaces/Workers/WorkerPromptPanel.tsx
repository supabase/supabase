import { useParams } from 'common'
import { Code, FileCode, Sparkles, Terminal } from 'lucide-react'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptPanel,
  PromptTitle,
} from 'ui-patterns/PromptPanel'

import { buildWorkerSnippets, type WorkerSnippetInput } from './workerSnippets'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'

interface WorkerPromptPanelProps {
  input: Omit<WorkerSnippetInput, 'endpoint' | 'protocol'>
  className?: string
}

// Pull the CodeBlock out to the PromptPanel body edges and drop its frame so it
// blends into the panel (the panel already draws the border, header, and copy).
const codeBlockWrapperClassName = '!-mx-4 !-my-3.5'
const codeBlockClassName = '!border-0 !rounded-none !bg-transparent !px-4 !py-3.5 text-xs'

/**
 * The Workers getting-started card. Reuses the docs `PromptPanel` so the CLI,
 * config, and cURL tabs get language-correct syntax highlighting via
 * `CodeBlock`. The compound `<Prompt>` children must be inlined here (detection
 * is by `displayName` and would break if wrapped in another component).
 */
export const WorkerPromptPanel = ({ input, className }: WorkerPromptPanelProps) => {
  const { ref } = useParams()

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const snippets = buildWorkerSnippets({
    ...input,
    endpoint: settings?.app_config?.endpoint,
    protocol: settings?.app_config?.protocol,
  })

  return (
    <PromptPanel className={className} adaptiveHeight>
      <Prompt value="ai">
        <PromptTitle icon={<Sparkles />}>AI Prompt</PromptTitle>
        <PromptCopy>{snippets.aiPrompt}</PromptCopy>
        <PromptContent shimmer={false}>{snippets.aiPrompt}</PromptContent>
      </Prompt>
      <Prompt value="cli">
        <PromptTitle icon={<Terminal />}>CLI</PromptTitle>
        <PromptCopy>{snippets.cli}</PromptCopy>
        <PromptContent shimmer={false}>
          <CodeBlock
            value={snippets.cli}
            language="bash"
            hideLineNumbers
            hideCopy
            focusable={false}
            wrapperClassName={codeBlockWrapperClassName}
            className={codeBlockClassName}
          />
        </PromptContent>
      </Prompt>
      <Prompt value="config">
        <PromptTitle icon={<FileCode />}>config.toml</PromptTitle>
        <PromptCopy>{snippets.configToml}</PromptCopy>
        <PromptContent shimmer={false}>
          <CodeBlock
            value={snippets.configToml}
            language="toml"
            hideLineNumbers
            hideCopy
            focusable={false}
            wrapperClassName={codeBlockWrapperClassName}
            className={codeBlockClassName}
          />
        </PromptContent>
      </Prompt>
      <Prompt value="curl">
        <PromptTitle icon={<Code />}>cURL</PromptTitle>
        <PromptCopy>{snippets.curl}</PromptCopy>
        <PromptContent shimmer={false}>
          <CodeBlock
            value={snippets.curl}
            language="curl"
            hideLineNumbers
            hideCopy
            focusable={false}
            wrapperClassName={codeBlockWrapperClassName}
            className={codeBlockClassName}
          />
        </PromptContent>
      </Prompt>
    </PromptPanel>
  )
}
