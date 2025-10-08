export { CREATE_PG_GET_TABLEDEF_SQL } from './database-table-definition'

// https://www.postgresql.org/docs/current/catalog-pg-constraint.html

export enum FOREIGN_KEY_CASCADE_ACTION {
  NO_ACTION = 'a',
  RESTRICT = 'r',
  CASCADE = 'c',
  SET_NULL = 'n',
  SET_DEFAULT = 'd',
}
