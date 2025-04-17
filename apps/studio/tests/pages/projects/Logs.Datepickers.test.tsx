import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { PREVIEWER_DATEPICKER_HELPERS } from 'components/interfaces/Settings/Logs/Logs.constants'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { expect, test, vi } from 'vitest'
import { render } from '../../helpers'
import { DatetimeHelper } from 'components/interfaces/Settings/Logs/Logs.types'

dayjs.extend(timezone)
dayjs.extend(utc)

const mockFn = vi.fn()

test('renders warning', async () => {
  const from = dayjs().subtract(10, 'days')
  const to = dayjs()

  render(
    <LogsDatePicker
      helpers={[]}
      onSubmit={mockFn}
      value={{
        from: from.toISOString(),
        to: to.toISOString(),
      }}
    />
  )
  await userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  await screen.findByText(/memory errors/)
  await screen.findByText(RegExp(from.format('DD MMM')))
})

test('renders dates in local time', async () => {
  const from = dayjs().subtract(1, 'days')
  const to = dayjs()
  render(
    <LogsDatePicker
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      onSubmit={mockFn}
      value={{
        from: from.toISOString(),
        to: to.toISOString(),
      }}
    />
  )
  // renders time locally
  await userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  await screen.findByText(RegExp(from.format('MMMM YYYY')))
})

test('renders datepicker selected dates in local time', async () => {
  const from = dayjs().date(25)
  const to = dayjs().date(27)
  render(
    <LogsDatePicker
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      value={{
        from: from.toISOString(),
        to: to.toISOString(),
      }}
      onSubmit={mockFn}
    />
  )
  // renders time locally
  await userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  // inputs with local time
  await screen.findByText(
    `${from.format('DD MMM')}, ${from.format('HH:mm')} - ${to.format('DD MMM')}, ${to.format('HH:mm')}`
  )
  // selected date should be in local time
  await screen.findByText('25', { selector: "*[class*='--range-start'" })
  await screen.findByText('27', { selector: "*[class*='--range-end'" })
})

test('datepicker onSubmit will return ISO string of selected dates', async () => {
  const mockFn = vi.fn()
  const todayAt1300 = dayjs().hour(13).minute(0).second(0).millisecond(0).toISOString()
  const todayAt2359 = dayjs().hour(23).minute(59).second(59).millisecond(0).toISOString()

  render(
    <LogsDatePicker
      helpers={PREVIEWER_DATEPICKER_HELPERS}
      value={{
        from: todayAt1300,
        to: todayAt2359,
      }}
      onSubmit={mockFn}
    />
  )

  // open the datepicker
  userEvent.click(screen.getByText(/13:00/i))

  // Get today's date and tomorrow's date
  const today = dayjs()
  const tomorrow = today.add(1, 'day')

  // Find and click on today's date
  const todayElement = await screen.findByText(today.format('D'))
  userEvent.click(todayElement)

  // Find and click on tomorrow's date
  const tomorrowElement = await screen.findByText(tomorrow.format('D'))
  userEvent.click(tomorrowElement)

  await userEvent.click(await screen.findByText('Apply'))
  expect(mockFn).toBeCalled()

  const call = mockFn.mock.calls[0][0]

  expect(call).toMatchObject({
    from: dayjs().date(today.date()).hour(13).minute(0).second(0).millisecond(0).toISOString(),
    to: dayjs().date(tomorrow.date()).hour(23).minute(59).second(59).millisecond(0).toISOString(),
  })
})

test('disabled helpers are disabled', async () => {
  const helpers: DatetimeHelper[] = [
    {
      text: 'Last 7 days',
      calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
      calcTo: () => '',
    },
    {
      text: 'Last 30 days',
      calcFrom: () => dayjs().subtract(30, 'day').startOf('day').toISOString(),
      calcTo: () => '',
      disabled: true,
    },
  ]

  const el = render(
    <LogsDatePicker
      helpers={helpers}
      onSubmit={mockFn}
      value={{
        from: dayjs().subtract(7, 'day').startOf('day').toISOString(),
        to: '',
        isHelper: true,
        text: 'Last 7 days',
      }}
    />
  )

  // click the datepicker
  userEvent.click(screen.getByText('Last 7 days'))

  const disabledHelperContainer = await screen.findByText(/last 30 days/i)

  const disabledButton = within(disabledHelperContainer).getByRole('radio', {
    hidden: true,
  })

  expect(disabledButton.getAttribute('aria-disabled')).toBe('true')
})

test('passing a value prop shows the correct dates in the label', async () => {
  const from = dayjs().subtract(10, 'days')
  const to = dayjs()

  render(
    <LogsDatePicker
      helpers={[]}
      value={{ from: from.toISOString(), to: to.toISOString() }}
      onSubmit={mockFn}
    />
  )

  await screen.findByText(
    `${from.format('DD MMM')}, ${from.format('HH:mm')} - ${to.format('DD MMM')}, ${to.format('HH:mm')}`
  )

  // change the date
  userEvent.click(await screen.findByText(RegExp(from.format('DD MMM'))))
  userEvent.click(await screen.findByText(RegExp(to.format('DD MMM'))))

  await screen.findByText(
    `${from.format('DD MMM')}, ${from.format('HH:mm')} - ${to.format('DD MMM')}, ${to.format('HH:mm')}`
  )
})

test('passing a helper as a value prop shows the helper text in the label', async () => {
  const helper = {
    text: 'Last 7 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  }

  render(
    <LogsDatePicker
      helpers={[helper]}
      value={{
        from: helper.calcFrom(),
        to: helper.calcTo(),
        isHelper: true,
        text: helper.text,
      }}
      onSubmit={mockFn}
    />
  )

  await screen.findByText(helper.text)
})
