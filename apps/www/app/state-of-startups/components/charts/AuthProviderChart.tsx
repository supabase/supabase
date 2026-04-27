import { buildWhereClause, SurveyChart } from '../SurveyChart'

function generateAuthProviderSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH auth_provider_mapping AS (
    SELECT
      id,
      CASE
        WHEN provider IN (
          'Supabase Auth',
          'Auth0',
          'Clerk',
          'NextAuth / Auth.js',
          'Firebase Auth',
          'AWS Cognito',
          'Stytch',
          'WorkOS',
          'Rolled our own'
        ) THEN provider
        ELSE 'Other'
      END AS provider_clean
    FROM (
      SELECT id, unnest(auth_provider) AS provider
      FROM responses_2026
      ${whereClause}
    ) sub
  )
  SELECT
    provider_clean AS provider,
    COUNT(DISTINCT id) AS total
  FROM auth_provider_mapping
  GROUP BY provider_clean
  ORDER BY total DESC;`
}

export function AuthProviderChart() {
  return (
    <SurveyChart
      title="What authentication provider do you use?"
      targetColumn="auth_provider"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_auth_provider_stats"
      newInYear={2026}
      generateSQLQuery={generateAuthProviderSQL}
    />
  )
}
