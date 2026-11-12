'use client'

import { CodeSquareIcon, DownloadIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
  QueryRunButton,
} from 'surfaces/explorer'

export default function SurfacesExplorerToolbar() {
  const [title, setTitle] = useState('Companies by industry')

  return (
    <div className="w-full rounded-md border">
      <ExplorerToolbar aria-label="Query toolbar">
        <ExplorerToolbarIcon>
          <CodeSquareIcon size={16} strokeWidth={2} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle onSaveTitle={setTitle}>{title}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <ExplorerToolbarAction
            aria-label="Download results"
            tooltip="Download results"
            icon={<DownloadIcon size={16} strokeWidth={2} />}
          />
          <ExplorerToolbarAction
            aria-label="Hide query"
            tooltip="Hide query"
            icon={<EyeOffIcon size={16} strokeWidth={2} />}
          />
          <QueryRunButton
            isExecuting={false}
            disabled={false}
            hasSelection={false}
            onRun={() => {}}
            onRunSelected={() => {}}
          />
        </ExplorerToolbarActions>
      </ExplorerToolbar>
    </div>
  )
}
