import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, IconCommand, IconCornerDownLeft, IconDownload } from 'ui'
import DownloadSnippetModal from '../DownloadSnippetModal'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'
import SizeToggleButton from './SizeToggleButton'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  executeQuery: () => void
}

const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  executeQuery,
}: UtilityActionsProps) => {
  const os = detectOS()
  const snap = useSqlEditorStateSnapshot()
  const [isDownloadSnippetModalOpen, setIsDownloadSnippetModalOpen] = useState(false)

  const snippet = snap.snippets[id]?.snippet

  return (
    <>
      {snippet && (
        <DownloadSnippetModal
          id={id}
          visible={isDownloadSnippetModalOpen}
          onCancel={() => setIsDownloadSnippetModalOpen(false)}
        />
      )}
      <SavingIndicator id={id} />
      {IS_PLATFORM && snippet && (
        <Button
          type="text"
          size="tiny"
          icon={<IconDownload size="tiny" />}
          onClick={() => setIsDownloadSnippetModalOpen(true)}
        >
          Download as migration file
        </Button>
      )}
      {IS_PLATFORM && <FavoriteButton id={id} />}
      <SizeToggleButton id={id} />
      <Button
        onClick={() => executeQuery()}
        disabled={isDisabled || isExecuting}
        loading={isExecuting}
        type="default"
        size="tiny"
        className="mx-2"
        iconRight={
          <div className="flex items-center space-x-1">
            {os === 'macos' ? (
              <IconCommand size={10} strokeWidth={1.5} />
            ) : (
              <p className="text-xs text-scale-1100">CTRL</p>
            )}
            <IconCornerDownLeft size={10} strokeWidth={1.5} />
          </div>
        }
      >
        RUN
      </Button>
    </>
  )
}

export default UtilityActions
