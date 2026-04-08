export const getKeywordsSql = () => {
  const sql = /* SQL */ `
-- source: dashboard
-- description: Fetch all PostgreSQL reserved and non-reserved keywords
SELECT word FROM pg_get_keywords();
`.trim()

  return sql
}
