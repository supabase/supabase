// mock the fetch function
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock the settings layout
jest.mock('components/layouts', () => ({
  SettingsLayout: jest.fn()
    .mockImplementation(({ children }) => <div>{children}</div>)
}))

// mock mobx
jest.mock('mobx-react-lite')
import { observer } from 'mobx-react-lite'
observer.mockImplementation(v => v)

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
useRouter.mockReturnValue({ query: { ref: "123", type: "auth" } })

import { LogPage } from 'pages/project/[ref]/settings/logs/[type]'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { SWRConfig } from 'swr'

test('can display log data and metadata', async () => {
  const data = [{
    id: "seome-uuid",
    timestamp: 1621323232312,
    event_message: "some event happened",
    metadata: {
      my_key: "something_value"
    }
  }]
  get.mockResolvedValue({ data })
  render(<LogPage />)

  await waitFor(() => screen.getByText(/happened/))
  const row = screen.getByText(/happened/)
  fireEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))
  await waitFor(() => screen.getByText(/something_value/))
})

test('Refresh', async () => {
  const data = [{
    id: "some-uuid",
    timestamp: 1621323232312,
    event_message: "some event happened",
    metadata: {
      my_key: "something_value"
    }
  }]
  get.mockResolvedValue({ data })
  render(
    <SWRConfig value={{ dedupingInterval: null }}>
      <LogPage />
    </SWRConfig>
  )

  const row = screen.getByText(/happened/)
  fireEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))
  expect(get).toBeCalledTimes(1)
  get.mockResolvedValue({ data: [] })

  // simulate full refresh, loop because swr dedupe behaves weirdly
  await waitFor(() => {
    fireEvent.click(screen.getByText(/Refresh/))
    expect(get).toBeCalledTimes(2)
  })
  // when log line unmounts and it was focused, should close focus panel
  await waitFor(() => expect(() => screen.getByText(/my_key/)).toThrow())
  await waitFor(() => expect(() => screen.getByText(/happened/)).toThrow())
})
