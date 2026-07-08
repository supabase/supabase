const { defineConfig } = require('eslint/config')
const barrelFiles = require('eslint-plugin-barrel-files')
const jsxA11y = require('eslint-plugin-jsx-a11y')
const supabaseConfig = require('eslint-config-supabase/next')

// Analytics SQL wire boundary — see the block below for context. Shared so the
// API/route block can re-include it (flat config replaces, not merges, a rule's
// options when blocks overlap, so the later block must carry these forward).
const ANALYTICS_SQL_RESTRICTED_SYNTAX = [
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
]

// Ban constructing a Supabase client at module scope in API route files. The
// TanStack server imports the entire route tree at boot (loadEntries), so a
// module-scope createClient with an env var that's unset in that environment
// (e.g. SUPABASE_URL on platform) throws on import and 500s every route — a
// runtime-only failure that's painful to catch. Construct it lazily inside the
// handler instead (see lib/api/self-hosted-admin.ts).
const NO_MODULE_SCOPE_CREATE_CLIENT = {
  selector:
    ":matches(Program, ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator > CallExpression[callee.name='createClient']",
  message:
    'Do not construct a Supabase client at module scope in API route files — the TanStack server evaluates every route module at boot, so a missing env var (e.g. SUPABASE_URL on platform) crashes every route. Construct it lazily inside the handler (see lib/api/self-hosted-admin.ts).',
}

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
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/control-has-associated-label': ['warn', { controlComponents: ['Button', 'Switch'] }],
      'jsx-a11y/label-has-associated-control': [
        'warn',
        { labelComponents: ['Label'], controlComponents: ['Input', 'Switch'] },
      ],
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/no-aria-hidden-on-focusable': 'warn',
      'jsx-a11y/tabindex-no-positive': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/no-distracting-elements': 'warn',
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
      'no-restricted-syntax': ['error', ...ANALYTICS_SQL_RESTRICTED_SYNTAX],
    },
  },
  // API route modules are eagerly imported by the TanStack server at boot, so
  // module-scope side effects there are especially dangerous. This block also
  // re-includes the analytics selectors because flat config replaces (not
  // merges) a rule's options for overlapping files.
  {
    files: ['pages/api/**/*.ts', 'pages/api/**/*.tsx', 'routes/**/*.ts', 'routes/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...ANALYTICS_SQL_RESTRICTED_SYNTAX,
        NO_MODULE_SCOPE_CREATE_CLIENT,
      ],
    },
  },
])
