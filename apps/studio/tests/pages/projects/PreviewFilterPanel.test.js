import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../helpers'

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
import { clickDropdown } from 'tests/helpers'
useFlag.mockReturnValue(true)

test('filter input change and submit', async () => {
  const mockFn = jest.fn()
  render(<PreviewFilterPanel onSearch={mockFn} />)
  expect(mockFn).not.toBeCalled()
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, '12345{enter}')
  expect(mockFn).toBeCalled()
})

test('filter input value', async () => {
  render(<PreviewFilterPanel defaultSearchValue={'1234'} />)
  await screen.findByDisplayValue('1234')
})

test('Manual refresh', async () => {
  const mockFn = jest.fn()
  render(<PreviewFilterPanel onRefresh={mockFn} />)
  const btn = await screen.findByText(/Refresh/)
  userEvent.click(btn)
  expect(mockFn).toBeCalled()
})
test('Datepicker dropdown', async () => {
  const fn = jest.fn()
  render(<PreviewFilterPanel onSearch={fn} />)
  clickDropdown(await screen.findByText(/Last hour/))
  userEvent.click(await screen.findByText(/Last 3 hours/))
  expect(fn).toBeCalled()
})

test('shortened count to K', async () => {
  render(<PreviewFilterPanel newCount={1234} />)
  await screen.findByText(/1\.2K/)
})
