import { screen } from '@testing-library/react'

import { render } from 'tests/helpers'
import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'

test('run and clear', async () => {
  const mockRun = jest.fn()
  const mockClear = jest.fn()
  render(<LogsQueryPanel warnings={[]} onRun={mockRun} onClear={mockClear} hasEditorValue />)
  await expect(screen.findByPlaceholderText(/Search/)).rejects.toThrow()
})
