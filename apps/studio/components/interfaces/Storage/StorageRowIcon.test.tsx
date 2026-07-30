import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from './Storage.constants'
import { StorageRowIcon } from './StorageRowIcon'

const CASES: {
  name: string
  view?: STORAGE_VIEWS
  status?: STORAGE_ROW_STATUS
  fileType?: STORAGE_ROW_TYPES
  isOpened?: boolean
  mimeType?: string
}[] = [
  { name: 'loading', view: STORAGE_VIEWS.LIST, status: STORAGE_ROW_STATUS.LOADING },
  { name: 'closed folder', fileType: STORAGE_ROW_TYPES.FOLDER },
  { name: 'open folder', fileType: STORAGE_ROW_TYPES.FOLDER, isOpened: true },
  { name: 'image', mimeType: 'image/png' },
  { name: 'audio', mimeType: 'audio/mpeg' },
  { name: 'video', mimeType: 'video/mp4' },
  { name: 'generic file' },
]

describe('StorageRowIcon', () => {
  test.each(CASES)('renders $name at the canonical stroke width', (props) => {
    const { container } = render(
      <StorageRowIcon
        view={props.view ?? STORAGE_VIEWS.COLUMNS}
        status={props.status ?? STORAGE_ROW_STATUS.READY}
        fileType={props.fileType ?? STORAGE_ROW_TYPES.FILE}
        isOpened={props.isOpened}
        mimeType={props.mimeType}
      />
    )

    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.5')
  })
})
