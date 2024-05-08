import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from 'tests/helpers'
import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'

test('run and clear', async () => {
  render(<LogsQueryPanel warnings={[]} onRun={mockRun} onClear={mockClear} hasEditorValue />)
  await expect(screen.findByPlaceholderText(/Search/)).rejects.toThrow()
})
