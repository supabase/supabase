import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DatePickers from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { PREVIEWER_DATEPICKER_HELPERS } from 'components/interfaces/Settings/Logs/Logs.constants'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { vi } from 'vitest'
import { render } from '../../helpers'

dayjs.extend(timezone)
dayjs.extend(utc)

const mockFn = vi.fn()

test('renders warning', async () => {
  const from = dayjs().subtract(60, 'days')
  const to = dayjs()

  render(
    <DatePickers
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      to={to.toISOString()}
      from={from.toISOString()}
      onChange={mockFn}
    />
  )
  userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  await screen.findByText(/memory errors/)
  await screen.findByText(RegExp(from.format('MMMM YYYY')))
})

test('renders dates in local time', async () => {
  const from = dayjs().subtract(1, 'days')
  const to = dayjs()
  render(
    <DatePickers
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      to={to.toISOString()}
      from={from.toISOString()}
      onChange={mockFn}
    />
  )
  // renders time locally
  userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  await screen.findByText(RegExp(from.format('MMMM YYYY')))
})

test('renders datepicker selected dates in local time', async () => {
  const from = dayjs().date(25)
  const to = dayjs().date(27)
  render(
    <DatePickers
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      to={to.toISOString()}
      from={from.toISOString()}
      onChange={mockFn}
    />
  )
  // renders time locally
  userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  // inputs with local time
  await screen.findAllByDisplayValue(from.format('HH'))
  await screen.findAllByDisplayValue(from.format('mm'))
  await screen.findAllByDisplayValue(to.format('HH'))
  await screen.findAllByDisplayValue(to.format('mm'))
  // selected date should be in local time
  await screen.findByText('25', { selector: "*[class*='--selected'" })
  await screen.findByText('27', { selector: "*[class*='--range-end'" })
})

test('datepicker onChange will return ISO string of selected dates', async () => {
  const mockFn = vi.fn()
  render(<DatePickers helpers={PREVIEWER_DATEPICKER_HELPERS} to={''} from={''} onChange={mockFn} />)
  // renders time locally
  userEvent.click(await screen.findByText('Custom'))
  // inputs with local time
  const toHH = await screen.findByDisplayValue('23')
  userEvent.clear(toHH)
  userEvent.type(toHH, '12')

  // Find and click on the date elements
  const day20 = await screen.findByText('20')
  userEvent.click(day20)

  const day21 = await screen.findByText('21')
  userEvent.click(day21)

  userEvent.click(await screen.findByText('Apply'))
  expect(mockFn).toBeCalled()

  const call = mockFn.mock.calls[0][0]

  expect(call).toMatchObject({
    from: dayjs().date(20).hour(0).minute(0).second(0).millisecond(0).toISOString(),
    to: dayjs().date(21).hour(12).minute(59).second(59).millisecond(0).toISOString(),
  })
})
