import { buildWhereClause } from './SurveyChart'

export interface ChartConfig {
  id: string
  title: string
  targetColumn: string
  filterColumns: string[]
  functionName: string
  generateSQLQuery?: (activeFilters: Record<string, string>) => string
}

// SQL generation functions for each chart
function generateRoleSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  CASE 
    WHEN role = 'Founder / Co-founder' THEN 'Founder'
    WHEN role IN ('Engineer', 'Founder / Co-founder') THEN role
    ELSE 'Other'
  END AS role, 
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY CASE 
    WHEN role = 'Founder / Co-founder' THEN 'Founder'
    WHEN role IN ('Engineer', 'Founder / Co-founder') THEN role
    ELSE 'Other'
  END
ORDER BY total DESC;`
}

function generateIndustrySQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['industry IS NOT NULL'])

  return `WITH industry_mapping AS (
  SELECT 
    industry,
    CASE 
      WHEN industry = 'Developer tools and platforms' THEN 'Dev tools'
      WHEN industry = 'AI / ML tools' THEN 'AI / ML'
      WHEN industry IN ('SaaS', 'Dev tools', 'AI / ML', 'Consumer', 'Education', 'eCommerce', 'Fintech', 'Healthtech') THEN industry
      ELSE 'Other'
    END AS industry_clean
  FROM responses_2025
  ${whereClause}
)
SELECT 
  industry_clean AS industry,
  COUNT(*) AS total
FROM industry_mapping
GROUP BY industry_clean
ORDER BY total DESC;`
}

function generateFundingStageSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  funding_stage,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY funding_stage
ORDER BY total DESC;`
}

function generateAcceleratorParticipationSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  CASE 
    WHEN accelerator_participation = 'Yes' THEN 'Yes'
    WHEN accelerator_participation = 'No' THEN 'No'
    ELSE 'Other'
  END AS accelerator_participation,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY CASE 
    WHEN accelerator_participation = 'Yes' THEN 'Yes'
    WHEN accelerator_participation = 'No' THEN 'No'
    ELSE 'Other'
  END
ORDER BY total DESC;`
}

function generateDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH database_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN technology IN (
          'Supabase',
          'PostgreSQL',
          'MySQL',
          'MongoDB',
          'Redis',
          'Firebase',
          'SQLite'
        ) THEN technology
        ELSE 'Other'
      END AS technology_clean
    FROM (
      SELECT id, unnest(databases) AS technology
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    technology_clean AS technology,
    COUNT(DISTINCT id) AS total
  FROM database_mapping
  GROUP BY technology_clean
  ORDER BY total DESC;`
}

function generateAICodingToolsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH ai_tools_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN tool IN (
          'GitHub Copilot',
          'Cursor',
          'Claude',
          'ChatGPT',
          'Other'
        ) THEN tool
        ELSE 'Other'
      END AS tool_clean
    FROM (
      SELECT id, unnest(ai_coding_tools) AS tool
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    tool_clean AS tool,
    COUNT(DISTINCT id) AS total
  FROM ai_tools_mapping
  GROUP BY tool_clean
  ORDER BY total DESC;`
}

function generateAIModelsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH ai_models_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN model IN (
          'GPT-4',
          'Claude 3',
          'Gemini',
          'Llama',
          'Other'
        ) THEN model
        ELSE 'Other'
      END AS model_clean
    FROM (
      SELECT id, unnest(ai_models) AS model
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    model_clean AS model,
    COUNT(DISTINCT id) AS total
  FROM ai_models_mapping
  GROUP BY model_clean
  ORDER BY total DESC;`
}

function generateRegularSocialMediaUseSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  regular_social_media_use,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY regular_social_media_use
ORDER BY total DESC;`
}

function generateNewIdeasSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  new_ideas_source,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY new_ideas_source
ORDER BY total DESC;`
}

function generateInitialPayingCustomersSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  initial_paying_customers,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY initial_paying_customers
ORDER BY total DESC;`
}

function generateSalesToolsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `WITH sales_tools_mapping AS (
    SELECT 
      id,
      CASE 
        WHEN tool IN (
          'HubSpot',
          'Salesforce',
          'Pipedrive',
          'Other'
        ) THEN tool
        ELSE 'Other'
      END AS tool_clean
    FROM (
      SELECT id, unnest(sales_tools) AS tool
      FROM responses_2025
      ${whereClause}
    ) sub
  )
  SELECT 
    tool_clean AS tool,
    COUNT(DISTINCT id) AS total
  FROM sales_tools_mapping
  GROUP BY tool_clean
  ORDER BY total DESC;`
}

function generateWorldOutlookSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  world_outlook,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY world_outlook
ORDER BY total DESC;`
}

function generateBiggestChallengeSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  biggest_challenge,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY biggest_challenge
ORDER BY total DESC;`
}

function generateLocationSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `SELECT 
  location,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY location
ORDER BY total DESC;`
}

export const CHART_CONFIGS: ChartConfig[] = [
  {
    id: 'role',
    title: 'What is your functional role at your startup?',
    targetColumn: 'role',
    filterColumns: ['person_age', 'location', 'money_raised'],
    functionName: 'get_role_stats',
    generateSQLQuery: generateRoleSQL,
  },
  {
    id: 'industry',
    title: "What is your startup's primary industry or target customer segment?",
    targetColumn: 'industry',
    filterColumns: ['person_age', 'location', 'money_raised'],
    functionName: 'get_industry_stats',
    generateSQLQuery: generateIndustrySQL,
  },
  {
    id: 'funding_stage',
    title: 'What stage of funding are you in?',
    targetColumn: 'funding_stage',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_funding_stage_stats',
    generateSQLQuery: generateFundingStageSQL,
  },
  {
    id: 'accelerator_participation',
    title: 'Have you participated in an accelerator program?',
    targetColumn: 'accelerator_participation',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_accelerator_participation_stats',
    generateSQLQuery: generateAcceleratorParticipationSQL,
  },
  {
    id: 'databases',
    title: 'Which database(s) is your startup using?',
    targetColumn: 'databases',
    filterColumns: ['person_age', 'team_size', 'money_raised'],
    functionName: 'get_databases_stats',
    generateSQLQuery: generateDatabasesSQL,
  },
  {
    id: 'ai_coding_tools',
    title: 'Which AI coding tools do you use?',
    targetColumn: 'ai_coding_tools',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_ai_coding_tools_stats',
    generateSQLQuery: generateAICodingToolsSQL,
  },
  {
    id: 'ai_models',
    title: 'Which AI models do you use?',
    targetColumn: 'ai_models',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_ai_models_stats',
    generateSQLQuery: generateAIModelsSQL,
  },
  {
    id: 'regular_social_media_use',
    title: 'How often do you use social media?',
    targetColumn: 'regular_social_media_use',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_regular_social_media_use_stats',
    generateSQLQuery: generateRegularSocialMediaUseSQL,
  },
  {
    id: 'new_ideas',
    title: 'Where do you get new ideas from?',
    targetColumn: 'new_ideas_source',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_new_ideas_source_stats',
    generateSQLQuery: generateNewIdeasSQL,
  },
  {
    id: 'initial_paying_customers',
    title: 'How did you get your first paying customers?',
    targetColumn: 'initial_paying_customers',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_initial_paying_customers_stats',
    generateSQLQuery: generateInitialPayingCustomersSQL,
  },
  {
    id: 'sales_tools',
    title: 'Which sales tools do you use?',
    targetColumn: 'sales_tools',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_sales_tools_stats',
    generateSQLQuery: generateSalesToolsSQL,
  },
  {
    id: 'world_outlook',
    title: 'What is your outlook on the world?',
    targetColumn: 'world_outlook',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_world_outlook_stats',
    generateSQLQuery: generateWorldOutlookSQL,
  },
  {
    id: 'biggest_challenge',
    title: 'What is your biggest challenge?',
    targetColumn: 'biggest_challenge',
    filterColumns: ['person_age', 'location', 'money_raised', 'team_size'],
    functionName: 'get_biggest_challenge_stats',
    generateSQLQuery: generateBiggestChallengeSQL,
  },
  {
    id: 'location',
    title: 'Where are you located?',
    targetColumn: 'location',
    filterColumns: ['person_age', 'money_raised', 'team_size'],
    functionName: 'get_location_stats',
    generateSQLQuery: generateLocationSQL,
  },
]
