import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

test.todo('templates')
// , async () => {
//   const mockFn = jest.fn()
//   render(<PreviewFilterPanel templates={[{ label: 'Some option', onClick: mockFn }]} />)
//   const search = screen.getByPlaceholderText(/Search/)
//   userEvent.type(search, '12345')

//   // TODO templates dropdown interaction currently cannot be tested
//   // https://github.com/supabase/ui/issues/299
//   // userEvent.click(screen.getByText("Templates"))
//   // screen.debug()

//   // await waitFor(() => screen.getByText("Some option"))
//   // userEvent.click(screen.getByText("Some option"))
//   // expect(mockFn).toBeCalled()
// })

test('toggle event chart', async () => {
  const mockFn = jest.fn()
  const { rerender } = render(
    <PreviewFilterPanel onToggleEventChart={mockFn} isShowingEventChart={true} />
  )
  const toggle = await screen.getByText(/Event chart/)
  userEvent.click(toggle)
  expect(mockFn).toBeCalled()
  rerender(<PreviewFilterPanel isShowingEventChart={false} />)
})

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

test.todo('timestamp to/from filter default value')
// , async () => {
//   render(<PreviewFilterPanel defaultToValue="2022-01-18T10:43:39+0000" />)
//   userEvent.click(await screen.findByText('Custom'))
//   await screen.findByDisplayValue('2022-01-18T10:43:39+0000')
//   // TODO: use screen.findByLabelText when https://github.com/supabase/ui/issues/310 is resolved
//   await screen.findByText('To')
//   await screen.findByText('From')
// })

test.todo('timestamp to/from filter value change')
// , async () => {
//   const mockFn = jest.fn()
//   render(<PreviewFilterPanel onSearch={mockFn} />)
//   userEvent.click(await screen.findByText(/Now/))
//   // display iso timestamp
//   const year = new Date().getFullYear()
//   const inputs = await screen.findAllByDisplayValue(RegExp(year))

//   for (const input of inputs) {
//     // replace the input's value
//     userEvent.clear(input)

//     // get time 20 mins before
//     const newDate = new Date()
//     newDate.setMinutes(new Date().getMinutes() - 20)
//     userEvent.type(input, newDate.toISOString())
//   }

//   // input actions
//   const set = await screen.findByRole('button', { name: 'Set' })

//   userEvent.click(set)
//   expect(mockFn).toBeCalled()
//   await screen.findByText('Custom')
//   await screen.findByTitle(/Clear timestamp filter/)
// })
