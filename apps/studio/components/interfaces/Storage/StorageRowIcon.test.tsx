import { describe, expect, test } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from './Storage.constants'
import { StorageRowIcon } from './StorageRowIcon'
import { customRender } from '@/tests/lib/custom-render'

const CASES: {
  name: string
  view?: STORAGE_VIEWS
  status?: STORAGE_ROW_STATUS
  fileType?: STORAGE_ROW_TYPES
  isOpened?: boolean
  mimeType?: string
  expectedIcon: string
}[] = [
  {
    name: 'loading list row',
    view: STORAGE_VIEWS.LIST,
    status: STORAGE_ROW_STATUS.LOADING,
    expectedIcon: 'lucide-loader-circle',
  },
  {
    name: 'loading column row',
    view: STORAGE_VIEWS.COLUMNS,
    status: STORAGE_ROW_STATUS.LOADING,
    expectedIcon: 'lucide-file',
  },
  {
    name: 'ready list row',
    view: STORAGE_VIEWS.LIST,
    status: STORAGE_ROW_STATUS.READY,
    expectedIcon: 'lucide-file',
  },
  {
    name: 'closed folder',
    fileType: STORAGE_ROW_TYPES.FOLDER,
    expectedIcon: 'lucide-files-bucket',
  },
  {
    name: 'open folder',
    fileType: STORAGE_ROW_TYPES.FOLDER,
    isOpened: true,
    expectedIcon: 'lucide-folder-open',
  },
  { name: 'image', mimeType: 'image/png', expectedIcon: 'lucide-image' },
  { name: 'audio', mimeType: 'audio/mpeg', expectedIcon: 'lucide-music' },
  { name: 'video', mimeType: 'video/mp4', expectedIcon: 'lucide-film' },
  { name: 'generic file', expectedIcon: 'lucide-file' },
]

describe('StorageRowIcon', () => {
  test.each(CASES)('renders $name at the canonical stroke width', (props) => {
    const { container } = customRender(
      <StorageRowIcon
        view={props.view ?? STORAGE_VIEWS.COLUMNS}
        status={props.status ?? STORAGE_ROW_STATUS.READY}
        fileType={props.fileType ?? STORAGE_ROW_TYPES.FILE}
        isOpened={props.isOpened}
        mimeType={props.mimeType}
      />
    )

    const icon = container.querySelector('svg')

    expect(icon).toHaveClass(props.expectedIcon)
    expect(icon).toHaveAttribute('stroke-width', '1.5')
  })
})
