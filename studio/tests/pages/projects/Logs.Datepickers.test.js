import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PREVIEWER_DATEPICKER_HELPERS } from 'components/interfaces/Settings/Logs'
import DatePickers from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import dayjs from 'dayjs'

test('renders warning', async () => {
  const from = dayjs().subtract(60, 'days')
  const to = dayjs()
  render(
    <DatePickers
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      to={to.toISOString()}
      from={from.toISOString()}
    />
  )
  userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  await screen.findByText(/memory errors/)
})
