import { IS_PLATFORM, useParams } from 'common'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { BASE_PATH } from 'lib/constants'
import { useTheme } from 'next-themes'
import { McpConfigPanel } from 'ui-patterns/McpUrlBuilder'
import type { projectKeys } from './Connect.types'

export const McpTabContent = ({ projectKeys }: { projectKeys: projectKeys }) => {
  const { ref: projectRef } = useParams()

  return (
    <Panel className="bg-inherit border-none shadow-none">
      {projectRef ? (
        <McpTabContentInnerLoaded projectRef={projectRef} projectKeys={projectKeys} />
      ) : (
        <McpTabContentInnerLoading />
      )}
    </Panel>
  )
}

const McpTabContentInnerLoading = () => {
  return (
    <div className="flex flex-col gap-2">
      <ShimmeringLoader className="w-3/4" />
      <ShimmeringLoader className="w-1/2" />
    </div>
  )
}

const McpTabContentInnerLoaded = ({
  projectRef,
  projectKeys,
}: {
  projectRef: string
  projectKeys: projectKeys
}) => {
  const { resolvedTheme } = useTheme()

  return (
    <McpConfigPanel
      basePath={BASE_PATH}
      projectRef={projectRef}
      theme={resolvedTheme as 'light' | 'dark'}
      isPlatform={IS_PLATFORM}
      apiUrl={projectKeys.apiUrl ?? undefined}
    />
  )
}
