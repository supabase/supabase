import dayjs from 'dayjs'

export const NON_EXPIRING_TOKEN_VALUE = 'never'
export const CUSTOM_EXPIRY_VALUE = 'custom'

export const ExpiresAtOptions: Record<string, { value: string; label: string }> = {
  hour: {
    value: dayjs().add(1, 'hour').toISOString(),
    label: '1 hour',
  },
  day: {
    value: dayjs().add(1, 'days').toISOString(),
    label: '1 day',
  },
  week: {
    value: dayjs().add(7, 'days').toISOString(),
    label: '7 days',
  },
  month: {
    value: dayjs().add(30, 'days').toISOString(),
    label: '30 days',
  },
  never: {
    value: NON_EXPIRING_TOKEN_VALUE,
    label: 'Never',
  },
  custom: {
    value: CUSTOM_EXPIRY_VALUE,
    label: 'Custom',
  },
}
