import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getKeywordsSql = (): SafeSqlFragment => {
  return safeSql`SELECT word FROM pg_get_keywords();`
}
