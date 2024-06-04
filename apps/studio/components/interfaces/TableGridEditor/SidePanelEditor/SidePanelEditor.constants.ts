import { sortBy, concat } from 'lodash'
import type { PostgresDataTypeOption } from './SidePanelEditor.types'

export const NUMERICAL_TYPES = [
  'int2',
  'int4',
  'int8',
  'float4',
  'float8',
  'numeric',
  'double precision',
]
export const JSON_TYPES = ['json', 'jsonb']
export const TEXT_TYPES = ['text', 'varchar']

export const TIMESTAMP_TYPES = ['timestamp', 'timestamptz']
export const DATE_TYPES = ['date']
export const TIME_TYPES = ['time', 'timetz']
export const DATETIME_TYPES = concat(TIMESTAMP_TYPES, DATE_TYPES, TIME_TYPES)

export const OTHER_DATA_TYPES = ['uuid', 'bool', 'vector']
export const POSTGRES_DATA_TYPES = sortBy(
  concat(NUMERICAL_TYPES, JSON_TYPES, TEXT_TYPES, DATETIME_TYPES, OTHER_DATA_TYPES)
)

export const RECOMMENDED_ALTERNATIVE_DATA_TYPE: {
  [key: string]: { alternative: string; reference: string }
} = {
  varchar: {
    alternative: 'text',
    reference:
      "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_varchar.28n.29_by_default",
  },
  json: {
    alternative: 'jsonb',
    reference: 'https://www.postgresql.org/docs/current/datatype-json.html',
  },
  timetz: {
    alternative: 'timestamptz',
    reference: "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timetz",
  },
  timestamp: {
    alternative: 'timestamptz',
    reference:
      "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29",
  },
}

export const POSTGRES_DATA_TYPE_OPTIONS: PostgresDataTypeOption[] = [
  {
    name: 'int2',
    description: 'Signed two-byte integer',
    type: 'number',
  },
  {
    name: 'int4',
    description: 'Signed four-byte integer',
    type: 'number',
  },
  {
    name: 'int8',
    description: 'Signed eight-byte integer',
    type: 'number',
  },
  {
    name: 'float4',
    description: 'Single precision floating-point number (4 bytes)',
    type: 'number',
  },
  {
    name: 'float8',
    description: 'Double precision floating-point number (8 bytes)',
    type: 'number',
  },
  {
    name: 'numeric',
    description: 'Exact numeric of selectable precision',
    type: 'number',
  },
  {
    name: 'json',
    description: 'Textual JSON data',
    type: 'json',
  },
  {
    name: 'jsonb',
    description: 'Binary JSON data, decomposed',
    type: 'json',
  },
  {
    name: 'text',
    description: 'Variable-length character string',
    type: 'text',
  },
  {
    name: 'varchar',
    description: 'Variable-length character string',
    type: 'text',
  },
  {
    name: 'uuid',
    description: 'Universally unique identifier',
    type: 'text',
  },
  {
    name: 'date',
    description: 'Calendar date (year, month, day)',
    type: 'time',
  },
  {
    name: 'time',
    description: 'Time of day (no time zone)',
    type: 'time',
  },
  {
    name: 'timetz',
    description: 'Time of day, including time zone',
    type: 'time',
  },
  {
    name: 'timestamp',
    description: 'Date and time (no time zone)',
    type: 'time',
  },
  {
    name: 'timestamptz',
    description: 'Date and time, including time zone',
    type: 'time',
  },
  {
    name: 'bool',
    description: 'Logical boolean (true/false)',
    type: 'bool',
  },
]
