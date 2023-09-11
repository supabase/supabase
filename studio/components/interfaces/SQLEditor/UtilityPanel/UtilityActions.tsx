import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useState } from 'react'
import { Button, IconCommand, IconCornerDownLeft, IconDownload } from 'ui'
import ImportSnippetModal from '../ImportSnippetModal'
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
  const [isImportSnippetModalOpen, setIsImportSnippetModalOpen] = useState(false)

  return (
    <>
      <ImportSnippetModal
        id={id}
        visible={isImportSnippetModalOpen}
        onCancel={() => setIsImportSnippetModalOpen(false)}
      />
      <SavingIndicator id={id} />
      {IS_PLATFORM && (
        <Button
          type="text"
          size="tiny"
          icon={<IconDownload size="tiny" />}
          onClick={() => setIsImportSnippetModalOpen(true)}
        >
          Import locally
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
