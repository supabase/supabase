import LogTable from 'components/interfaces/Settings/Logs/LogTable'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
test('can display log data', async () => {
  render(<LogTable data={[{
    id: "seome-uuid",
    timestamp: 1621323232312,
    event_message: "some event happened",
    metadata: {
      my_key: "something_value"
    }
  }]} />)

  await waitFor(() => screen.getByText(/happened/))
  const row = screen.getByText(/happened/)
  fireEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))
  await waitFor(() => screen.getByText(/something_value/))
})
