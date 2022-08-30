import { TIMESTAMP_TYPES, DATE_TYPES, TIME_TYPES } from '../../SidePanelEditor.constants'

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
