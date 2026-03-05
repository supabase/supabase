import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  LogsDatePicker,
  parseCustomInput,
  convertToDays,
  getAvailableInForDays,
  generateDynamicHelper,
  generateDynamicHelpers,
  generateHelpersFromInput,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { PREVIEWER_DATEPICKER_HELPERS } from 'components/interfaces/Settings/Logs/Logs.constants'
import { DatetimeHelper } from 'components/interfaces/Settings/Logs/Logs.types'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { describe, expect, test, vi } from 'vitest'
import { render } from '../../helpers'

dayjs.extend(timezone)
dayjs.extend(utc)

describe('parseCustomInput', () => {
  test('returns invalid for empty input', () => {
    expect(parseCustomInput('')).toEqual({ type: 'invalid' })
    expect(parseCustomInput('   ')).toEqual({ type: 'invalid' })
  })

  test('parses number only input', () => {
    expect(parseCustomInput('25')).toEqual({ type: 'number', value: 25 })
    expect(parseCustomInput('  10  ')).toEqual({ type: 'number', value: 10 })
  })

  test('parses number with unit letter', () => {
    expect(parseCustomInput('2h')).toEqual({ type: 'unit', value: 2, unit: 'hour' })
    expect(parseCustomInput('30m')).toEqual({ type: 'unit', value: 30, unit: 'minute' })
    expect(parseCustomInput('7d')).toEqual({ type: 'unit', value: 7, unit: 'day' })
  })

  test('parses number with space and unit letter', () => {
    expect(parseCustomInput('2 h')).toEqual({ type: 'unit', value: 2, unit: 'hour' })
    expect(parseCustomInput('30 m')).toEqual({ type: 'unit', value: 30, unit: 'minute' })
    expect(parseCustomInput('7 d')).toEqual({ type: 'unit', value: 7, unit: 'day' })
  })

  test('parses number with full unit name prefix', () => {
    expect(parseCustomInput('2hour')).toEqual({ type: 'unit', value: 2, unit: 'hour' })
    expect(parseCustomInput('2hours')).toEqual({ type: 'invalid' })
    expect(parseCustomInput('4day')).toEqual({ type: 'unit', value: 4, unit: 'day' })
    expect(parseCustomInput('4days')).toEqual({ type: 'invalid' })
    expect(parseCustomInput('30min')).toEqual({ type: 'unit', value: 30, unit: 'minute' })
    expect(parseCustomInput('30minute')).toEqual({ type: 'unit', value: 30, unit: 'minute' })
  })

  test('is case insensitive', () => {
    expect(parseCustomInput('2H')).toEqual({ type: 'unit', value: 2, unit: 'hour' })
    expect(parseCustomInput('30M')).toEqual({ type: 'unit', value: 30, unit: 'minute' })
    expect(parseCustomInput('7D')).toEqual({ type: 'unit', value: 7, unit: 'day' })
  })

  test('returns invalid for non-matching unit', () => {
    expect(parseCustomInput('2x')).toEqual({ type: 'invalid' })
    expect(parseCustomInput('2yoie')).toEqual({ type: 'invalid' })
    expect(parseCustomInput('abc')).toEqual({ type: 'invalid' })
  })

  test('returns invalid for zero or negative', () => {
    expect(parseCustomInput('0')).toEqual({ type: 'invalid' })
    expect(parseCustomInput('-5')).toEqual({ type: 'invalid' })
  })
})

describe('convertToDays', () => {
  test('converts minutes to days', () => {
    expect(convertToDays(1440, 'minute')).toBe(1)
    expect(convertToDays(720, 'minute')).toBe(0.5)
  })

  test('converts hours to days', () => {
    expect(convertToDays(24, 'hour')).toBe(1)
    expect(convertToDays(48, 'hour')).toBe(2)
  })

  test('days remain unchanged', () => {
    expect(convertToDays(7, 'day')).toBe(7)
  })
})

describe('getAvailableInForDays', () => {
  test('returns all plans for <= 1 day', () => {
    expect(getAvailableInForDays(0.5)).toEqual(['free', 'pro', 'team', 'enterprise', 'platform'])
    expect(getAvailableInForDays(1)).toEqual(['free', 'pro', 'team', 'enterprise', 'platform'])
  })

  test('returns pro+ for <= 7 days', () => {
    expect(getAvailableInForDays(2)).toEqual(['pro', 'team', 'enterprise', 'platform'])
    expect(getAvailableInForDays(7)).toEqual(['pro', 'team', 'enterprise', 'platform'])
  })

  test('returns team+ for > 7 days', () => {
    expect(getAvailableInForDays(8)).toEqual(['team', 'enterprise', 'platform'])
    expect(getAvailableInForDays(30)).toEqual(['team', 'enterprise', 'platform'])
  })
})

describe('generateDynamicHelper', () => {
  test('generates helper with correct text', () => {
    const helper = generateDynamicHelper(5, 'hour')
    expect(helper.text).toBe('Last 5 hours')
  })

  test('uses singular form when value is 1', () => {
    expect(generateDynamicHelper(1, 'minute').text).toBe('Last 1 minute')
    expect(generateDynamicHelper(1, 'hour').text).toBe('Last 1 hour')
    expect(generateDynamicHelper(1, 'day').text).toBe('Last 1 day')
  })

  test('uses plural form when value > 1', () => {
    expect(generateDynamicHelper(2, 'minute').text).toBe('Last 2 minutes')
    expect(generateDynamicHelper(2, 'hour').text).toBe('Last 2 hours')
    expect(generateDynamicHelper(2, 'day').text).toBe('Last 2 days')
  })

  test('generates helper with correct availableIn based on time range', () => {
    const minuteHelper = generateDynamicHelper(30, 'minute')
    expect(minuteHelper.availableIn).toEqual(['free', 'pro', 'team', 'enterprise', 'platform'])

    const dayHelper = generateDynamicHelper(14, 'day')
    expect(dayHelper.availableIn).toEqual(['team', 'enterprise', 'platform'])
  })

  test('calcFrom returns correct ISO string', () => {
    const helper = generateDynamicHelper(1, 'hour')
    const from = dayjs(helper.calcFrom())
    const expectedFrom = dayjs().subtract(1, 'hour')
    expect(from.diff(expectedFrom, 'second')).toBeLessThan(2)
  })
})

describe('generateDynamicHelpers', () => {
  test('generates 3 helpers for minutes, hours, days', () => {
    const helpers = generateDynamicHelpers(5)
    expect(helpers).toHaveLength(3)
    expect(helpers[0].text).toBe('Last 5 minutes')
    expect(helpers[1].text).toBe('Last 5 hours')
    expect(helpers[2].text).toBe('Last 5 days')
  })
})

describe('generateHelpersFromInput', () => {
  test('returns null for invalid input', () => {
    expect(generateHelpersFromInput('')).toBeNull()
    expect(generateHelpersFromInput('abc')).toBeNull()
    expect(generateHelpersFromInput('2yoie')).toBeNull()
  })

  test('returns 3 helpers for number only input', () => {
    const helpers = generateHelpersFromInput('25')
    expect(helpers).toHaveLength(3)
    expect(helpers![0].text).toBe('Last 25 minutes')
    expect(helpers![1].text).toBe('Last 25 hours')
    expect(helpers![2].text).toBe('Last 25 days')
  })

  test('returns single helper for unit input', () => {
    const helpers = generateHelpersFromInput('2h')
    expect(helpers).toHaveLength(1)
    expect(helpers![0].text).toBe('Last 2 hours')
  })
})

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
  await screen.findByText(RegExp(from.format('DD MMM')))
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
  await screen.findByText('25', { selector: "*[aria-label*='selected'" })
  await screen.findByText('27', { selector: "*[aria-label*='selected'" })
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

  const day15 = dayjs().date(15)
  const day16 = day15.add(1, 'day')

  // Find and click on first date
  const day15Element = await screen.findByText(day15.format('D'))
  userEvent.dblClick(day15Element)

  // Find and click on second date
  const day16Element = await screen.findByText(day16.format('D'))
  userEvent.click(day16Element)

  await userEvent.click(await screen.findByText('Apply'))
  expect(mockFn).toBeCalled()

  const call = mockFn.mock.calls[0][0]

  expect(call).toMatchObject({
    from: dayjs().date(day15.date()).hour(13).minute(0).second(0).millisecond(0).toISOString(),
    to: dayjs().date(day16.date()).hour(23).minute(59).second(59).millisecond(0).toISOString(),
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
