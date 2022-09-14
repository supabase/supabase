import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from 'tests/helpers'
test.todo('templates')

test('run and clear', async () => {
  const mockRun = jest.fn()
  const mockClear = jest.fn()
  render(<LogsQueryPanel warnings={[]} onRun={mockRun} onClear={mockClear} hasEditorValue />)
  await expect(screen.findByPlaceholderText(/Search/)).rejects.toThrow()
  const run = await screen.findByText(/Run/)
  userEvent.click(run)
  expect(mockRun).toBeCalled()
  const clear = await screen.findByText(/Clear/)
  userEvent.click(clear)
  expect(mockClear).toBeCalled()
})
