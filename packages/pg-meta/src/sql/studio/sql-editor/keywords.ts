export const getKeywordsSql = () => {
  const sql = /* SQL */ `
SELECT word FROM pg_get_keywords();
`.trim()

  return sql
}
