import { SupaColumn } from '../types';

const NUMERICAL_TYPES = [
  'smallint',
  'integer',
  'bigint',
  'decimal',
  'numeric',
  'real',
  'double precision',
  'serial',
  'bigserial',
  'int2',
  'int4',
  'int8',
  'float4',
  'float8',
  'smallserial',
  'serial2',
  'serial4',
  'serial8',
];
export function isNumericalColumn(type: string) {
  return NUMERICAL_TYPES.indexOf(type.toLowerCase()) > -1;
}

const JSON_TYPES = ['json', 'jsonb', 'array'];
export function isJsonColumn(type: string) {
  return JSON_TYPES.indexOf(type.toLowerCase()) > -1;
}

const ARRAY_TYPES = ['array'];
export function isArrayColumn(type: string) {
  return ARRAY_TYPES.indexOf(type.toLowerCase()) > -1;
}

const TEXT_TYPES = ['text', 'character varying'];
export function isTextColumn(type: string) {
  return TEXT_TYPES.indexOf(type.toLowerCase()) > -1;
}

const TIMESTAMP_TYPES = ['timestamp', 'timestamptz'];
export function isDateTimeColumn(type: string) {
  return TIMESTAMP_TYPES.indexOf(type.toLowerCase()) > -1;
}

const DATE_TYPES = ['date'];
export function isDateColumn(type: string) {
  return DATE_TYPES.indexOf(type.toLowerCase()) > -1;
}

const TIME_TYPES = ['time', 'timetz'];
export function isTimeColumn(type: string) {
  return TIME_TYPES.indexOf(type.toLowerCase()) > -1;
}

const BOOL_TYPES = ['boolean', 'bool'];
export function isBoolColumn(type: string) {
  return BOOL_TYPES.indexOf(type.toLowerCase()) > -1;
}

const ENUM_TYPES = ['user-defined'];
export function isEnumColumn(type: string) {
  return ENUM_TYPES.indexOf(type.toLowerCase()) > -1;
}

export function isForeignKeyColumn(columnDef: SupaColumn) {
  const { targetTableSchema, targetTableName, targetColumnName } = columnDef;
  return !!targetTableSchema && !!targetTableName && !!targetColumnName;
}
