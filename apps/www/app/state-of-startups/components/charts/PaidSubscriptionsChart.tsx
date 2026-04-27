import { buildWhereClause, SurveyChart } from '../SurveyChart'

function generatePaidSubscriptionsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH subscriptions_mapping AS (
    SELECT
      id,
      CASE
        WHEN subscription IN (
          'Claude',
          'OpenAI / ChatGPT',
          'Cursor',
          'GitHub Copilot',
          'Gemini',
          'Lovable',
          'Perplexity',
          'Vercel',
          'Supabase'
        ) THEN subscription
        ELSE 'Other'
      END AS subscription_clean
    FROM (
      SELECT id, unnest(subscriptions) AS subscription
      FROM responses_2026
      ${whereClause}
    ) sub
  )
  SELECT
    subscription_clean AS subscription,
    COUNT(DISTINCT id) AS total
  FROM subscriptions_mapping
  GROUP BY subscription_clean
  ORDER BY total DESC;`
}

export function PaidSubscriptionsChart() {
  return (
    <SurveyChart
      title="Which subscriptions does your startup pay for?"
      targetColumn="subscriptions"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_subscriptions_stats"
      newInYear={2026}
      generateSQLQuery={generatePaidSubscriptionsSQL}
    />
  )
}
