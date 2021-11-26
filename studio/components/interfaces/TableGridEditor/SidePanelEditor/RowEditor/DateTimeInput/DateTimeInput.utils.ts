import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { TIMESTAMP_TYPES, DATE_TYPES, TIME_TYPES } from './DateTimeInput.constants'
import { DATE_FORMAT } from '../../SidePanelEditor.constants'

dayjs.extend(customParseFormat)

export function convertPostgresToInputValue(inputType: string, value?: string) {
  if (!value || value.length == 0) return ''

  switch (inputType) {
    case 'datetime-local': {
      return dayjs(value, DATE_FORMAT).format('YYYY-MM-DDTHH:mm:ss')
    }
    case 'time': {
      const serverTimeFormat = value && value.includes('+') ? 'HH:mm:ssZZ' : 'HH:mm:ss'
      return dayjs(value, serverTimeFormat).format('HH:mm:ss')
    }
    default:
      return value
  }
}

export function convertInputToPostgresValue(params: {
  inputType: string
  format: string
  value?: string
}) {
  const { inputType, format, value } = params
  if (!value || value.length == 0) return ''

  switch (inputType) {
    case 'datetime-local': {
      return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format(DATE_FORMAT)
    }
    case 'time': {
      const serverTimeFormat = format.toLowerCase() == 'timetz' ? 'HH:mm:ssZZ' : 'HH:mm:ss'
      return dayjs(value, 'HH:mm:ss').format(serverTimeFormat)
    }
    default:
      return value
  }
}

export function getColumnType(format: string) {
  if (isDateColumn(format)) {
    return 'date'
  } else if (isTimeColumn(format)) {
    return 'time'
  } else if (isDateTimeColumn(format)) {
    return 'datetime-local'
  } else return 'text'
}

function isDateTimeColumn(type: string) {
  return TIMESTAMP_TYPES.indexOf(type.toLowerCase()) > -1
}

function isDateColumn(type: string) {
  return DATE_TYPES.indexOf(type.toLowerCase()) > -1
}

function isTimeColumn(type: string) {
  return TIME_TYPES.indexOf(type.toLowerCase()) > -1
}
