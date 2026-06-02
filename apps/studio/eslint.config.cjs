const { defineConfig } = require('eslint/config')
const barrelFiles = require('eslint-plugin-barrel-files')
const jsxA11y = require('eslint-plugin-jsx-a11y')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  { files: ['**/*.ts', '**/*.tsx'] },
  supabaseConfig,
  {
    plugins: {
      'barrel-files': barrelFiles,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/jsx-key': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'components/ui/DataTable/DataTableColumn/DataTableColumnHeader',
              message: 'Use TanStackTableHeadSort from ui-patterns/Table instead.',
            },
          ],
        },
      ],
      'barrel-files/avoid-re-export-all': 'error',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },
  // Analytics SQL wire boundary: every call to a SQL-bearing analytics
  // endpoint (`logs.all` / `logs.all.otel`) must go through
  // `executeAnalyticsSql` so the `SafeLogSqlFragment` brand is enforced at the
  // type level. See .claude/skills/safe-sql-execution/SKILL.md.
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['data/logs/execute-analytics-sql.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.name=/^(post|get)$/][arguments.0.value='/platform/projects/{ref}/analytics/endpoints/logs.all']",
          message:
            'Do not call the analytics logs.all endpoint directly. Route through executeAnalyticsSql in @/data/logs/execute-analytics-sql so the SafeLogSqlFragment brand is enforced at compile time.',
        },
        {
          selector:
            "CallExpression[callee.name=/^(post|get)$/][arguments.0.value='/platform/projects/{ref}/analytics/endpoints/logs.all.otel']",
          message:
            'Do not call the analytics logs.all.otel endpoint directly. Route through executeAnalyticsSql in @/data/logs/execute-analytics-sql so the SafeLogSqlFragment brand is enforced at compile time.',
        },
      ],
    },
  },
])
