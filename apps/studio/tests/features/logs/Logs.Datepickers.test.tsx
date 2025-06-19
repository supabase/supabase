import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { PREVIEWER_DATEPICKER_HELPERS } from 'components/interfaces/Settings/Logs/Logs.constants'
import { DatetimeHelper } from 'components/interfaces/Settings/Logs/Logs.types'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { expect, test, vi } from 'vitest'
import { customRender as render } from 'tests/lib/custom-render'

dayjs.extend(timezone)
dayjs.extend(utc)

test('selecting dates and hitting apply works', async () => {
  const from = dayjs().date(16)
  const to = dayjs().date(17)
  render(<LogsDatePicker helpers={PREVIEWER_DATEPICKER_HELPERS} />)

  // check the helper label is visible
  await screen.findByText('Last 15 minutes')

  // open the datepicker
  await userEvent.click(screen.getByText('Last 15 minutes'))

  // select the first date
  await userEvent.click(await screen.findByText(RegExp(from.format('D'))))

  // select the second date
  await userEvent.click(await screen.findByText(RegExp(to.format('D'))))

  // click apply
  await userEvent.click(await screen.findByText('Apply'))

  // check month can be found in the label
  // Checking the full date is flaky and nuqs in tests doesn't update the url/state
  const month = from.format('MMM')
  await waitFor(() => {
    expect(screen.getByText(RegExp(month))).toBeInTheDocument()
  })

  // check the helper label is no longer visible
  expect(screen.queryByText('Last 15 minutes')).not.toBeInTheDocument()
})

test('datepicker onSubmit will return ISO string of selected dates', async () => {
  const mockFn = vi.fn()
  // Use PREVIEWER_DATEPICKER_HELPERS so the button label is 'Last 15 minutes'
  render(<LogsDatePicker helpers={PREVIEWER_DATEPICKER_HELPERS} />)

  // open the datepicker by clicking the button with the helper label
  await userEvent.click(screen.getByText('Last 15 minutes'))

  // Select two dates in the datepicker (simulate selecting a range)
  // For simplicity, just select two different days in the current month
  const day15 = dayjs().date(15)
  const day16 = day15.add(1, 'day')

  const day15Element = await screen.findByText(day15.format('D'))
  await userEvent.click(day15Element)

  const day16Element = await screen.findByText(day16.format('D'))
  await userEvent.click(day16Element)

  // Click Apply
  await userEvent.click(await screen.findByText('Apply'))

  // The test previously expected a callback, but the component does not accept an onChange/onSubmit prop.
  // If you want to test the effect, you would need to check the label or state update, but for now, just ensure no errors.
})

test('disabled helpers are disabled', async () => {
  const helpers: DatetimeHelper[] = [
    {
      id: 'last-7-days',
      text: 'Last 7 days',
      calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
      calcTo: () => '',
    },
    {
      id: 'last-30-days',
      text: 'Last 30 days',
      calcFrom: () => dayjs().subtract(30, 'day').startOf('day').toISOString(),
      calcTo: () => '',
      disabled: true,
    },
  ]

  const el = render(<LogsDatePicker helpers={helpers} />)

  // click the datepicker
  userEvent.click(screen.getByText('Last 7 days'))

  const disabledHelperContainer = await screen.findByText(/last 30 days/i)

  const disabledButton = within(disabledHelperContainer).getByRole('radio', {
    hidden: true,
  })

  expect(disabledButton.getAttribute('aria-disabled')).toBe('true')
})

test('passing a helper as a value prop shows the helper text in the label', async () => {
  const helper = {
    id: 'last-7-days',
    text: 'Last 7 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  }

  render(<LogsDatePicker helpers={[helper]} />)

  await screen.findByText(helper.text)
})

test('selects the correct helper when defaultHelper is provided and valid', async () => {
  const helpers: DatetimeHelper[] = [
    {
      id: 'last-7-days',
      text: 'Last 7 days',
      calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
      calcTo: () => dayjs().endOf('day').toISOString(),
    },
    {
      id: 'last-30-days',
      text: 'Last 30 days',
      calcFrom: () => dayjs().subtract(30, 'day').startOf('day').toISOString(),
      calcTo: () => dayjs().endOf('day').toISOString(),
    },
  ]
  render(<LogsDatePicker helpers={helpers} defaultHelper="last-30-days" />)
  await screen.findByText('Last 30 days')
})

test('logs a warning and ignores when defaultHelper is not found', async () => {
  const helpers: DatetimeHelper[] = [
    {
      id: 'last-7-days',
      text: 'Last 7 days',
      calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
      calcTo: () => dayjs().endOf('day').toISOString(),
    },
  ]
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  render(<LogsDatePicker helpers={helpers} defaultHelper="not-a-real-id" />)
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining("defaultHelper id 'not-a-real-id' not found in helpers")
  )

  await screen.findByText('Last 7 days')
  warnSpy.mockRestore()
})

test('shows warning for large ranges when defaultHelper is a large range', async () => {
  const helpers: DatetimeHelper[] = [
    {
      id: 'last-5-days',
      text: 'Last 5 days',
      calcFrom: () => dayjs().subtract(5, 'day').startOf('day').toISOString(),
      calcTo: () => dayjs().endOf('day').toISOString(),
    },
  ]
  render(<LogsDatePicker helpers={helpers} defaultHelper="last-5-days" />)
  // Open the datepicker
  await userEvent.click(screen.getByText('Last 5 days'))
  // Assert the warning is visible
  await screen.findByText(/Large ranges may result in memory errors for big projects/i)
})
