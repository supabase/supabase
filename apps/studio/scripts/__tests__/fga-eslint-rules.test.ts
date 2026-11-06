import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tsParser from '@typescript-eslint/parser'
import { RuleTester, type Rule } from 'eslint'

const { rules } = createRequire(import.meta.url)('../eslint-rules/fga.cjs') as {
  rules: Record<string, Rule.RuleModule>
}

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
})

ruleTester.run('no-unguarded-migrating', rules['no-unguarded-migrating'], {
  valid: [
    `get('/v1/projects/{ref}/branches', { grant })`,
    `get('/v1/projects/{ref}/branches', { grant: unguarded.byDesign('reason') })`,
    `const migrating = other.migrating`,
  ],
  invalid: [
    {
      code: `get('/v1/projects/{ref}/branches', { grant: unguarded.migrating })`,
      errors: [{ messageId: 'migrating' }],
    },
  ],
})

ruleTester.run('unguarded-by-design-reason', rules['unguarded-by-design-reason'], {
  valid: [`unguarded.byDesign('optimistic call')`, 'unguarded.byDesign(`optimistic call`)'],
  invalid: [
    { code: `unguarded.byDesign()`, errors: [{ messageId: 'reason' }] },
    { code: `unguarded.byDesign('')`, errors: [{ messageId: 'reason' }] },
    { code: `unguarded.byDesign('  ')`, errors: [{ messageId: 'reason' }] },
    { code: `unguarded.byDesign(reason)`, errors: [{ messageId: 'reason' }] },
    { code: 'unguarded.byDesign(`because ${reason}`)', errors: [{ messageId: 'reason' }] },
    { code: `unguarded.byDesign('a', 'b')`, errors: [{ messageId: 'reason' }] },
    { code: `const make = unguarded.byDesign`, errors: [{ messageId: 'reason' }] },
  ],
})

const IMPORT_POST = `import { post } from '@/data/fetchers'\n`

ruleTester.run('no-fetch-type-bypass', rules['no-fetch-type-bypass'], {
  valid: [
    IMPORT_POST + `post('/platform/feedback/send', { body, grant })`,
    // Suppressing a params mismatch inside the init doesn't hide the grant.
    IMPORT_POST +
      `post('/platform/auth/{ref}/validate/spam', {
  // @ts-expect-error the spec omits the path param
  params: { path: { ref } },
  grant,
})`,
    // Directives on calls to other `post` functions are fine.
    `import { post } from './platform-webhooks-fetchers'\n// @ts-expect-error\npost('/x', {})`,
    `// @ts-expect-error\npost('/x', {})`,
  ],
  invalid: [
    {
      code: IMPORT_POST + `// @ts-expect-error\npost('/platform/feedback/send', { body })`,
      errors: [{ messageId: 'tsDirective', data: { name: 'post' } }],
    },
    {
      code:
        IMPORT_POST + `// @ts-ignore reason\n// more context\npost('/platform/feedback/send', {})`,
      errors: [{ messageId: 'tsDirective' }],
    },
    {
      code: IMPORT_POST + `await post(\n  // @ts-ignore\n  path,\n  { grant }\n)`,
      errors: [{ messageId: 'tsDirective' }],
    },
    {
      code:
        IMPORT_POST +
        `post('/platform/feedback/send', {\n  body,\n  // @ts-expect-error\n  grant,\n})`,
      errors: [{ messageId: 'tsDirective' }],
    },
    {
      code: `// @ts-nocheck\n` + IMPORT_POST + `post('/platform/feedback/send', {})`,
      errors: [{ messageId: 'tsDirective' }],
    },
    {
      code: `import { del as remove } from './fetchers'\n// @ts-ignore\nremove('/x', {})`,
      filename: 'data/example-mutation.ts',
      errors: [{ messageId: 'tsDirective', data: { name: 'del' } }],
    },
    {
      code: `import { fetchGet, fetchPost } from '@/data/fetchers'`,
      errors: [
        { messageId: 'untypedFetch', data: { name: 'fetchGet' } },
        { messageId: 'untypedFetch', data: { name: 'fetchPost' } },
      ],
    },
  ],
})

const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/fga')

// Typed linting: the rule reads the brand off the TypeScript type, so these cases are parsed
// against a fixture project containing a minimal branded `grantedQueryOptions`.
const typedRuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      projectService: { allowDefaultProject: ['file.ts'], defaultProject: 'tsconfig.json' },
      tsconfigRootDir: FIXTURE_DIR,
    },
  },
})

const FIXTURE_IMPORT = `import { apiKeysQueryOptions, grantedQueryOptions } from './granted'\n`

function spreadCase(code: string, errors = 1) {
  return {
    code,
    filename: resolve(FIXTURE_DIR, 'file.ts'),
    errors: Array.from({ length: errors }, () => ({ messageId: 'spread' })),
  }
}

function validCase(code: string) {
  return { code, filename: resolve(FIXTURE_DIR, 'file.ts') }
}

typedRuleTester.run('no-spread-granted-query-options', rules['no-spread-granted-query-options'], {
  valid: [
    validCase(
      FIXTURE_IMPORT +
        `declare const grant: object\ndeclare const select: boolean\nexport const a = apiKeysQueryOptions({ projectRef: 'x', grant }, { enabled: select })`
    ),
    validCase(
      `import { plainQueryOptions } from './granted'\nexport const a = { ...plainQueryOptions({ projectRef: 'x' }), enabled: true }`
    ),
    validCase(
      `import { plainQueryOptions } from './granted'\nconst opts = plainQueryOptions({ projectRef: 'x' })\nexport const a = Object.assign(opts, { enabled: true })`
    ),
    // Spreading unrelated objects is fine, as is reading properties off granted options.
    validCase(
      FIXTURE_IMPORT +
        `const opts = apiKeysQueryOptions({ projectRef: 'x' })\nexport const a = { ...{ enabled: true }, key: opts.queryKey }`
    ),
  ],
  invalid: [
    spreadCase(
      FIXTURE_IMPORT +
        `declare const grant: object\nexport const a = { ...apiKeysQueryOptions({ projectRef: 'x', grant }), enabled: true }`
    ),
    // Variables passed in from a variable.
    spreadCase(
      FIXTURE_IMPORT +
        `const variables = { projectRef: 'x' }\nexport const a = { ...apiKeysQueryOptions(variables), enabled: true }`
    ),
    // Grant passed through spread props.
    spreadCase(
      FIXTURE_IMPORT +
        `declare const props: { projectRef: string; grant: object }\nexport const a = { ...apiKeysQueryOptions({ ...props }), enabled: true }`
    ),
    // Options stored in a variable, then spread.
    spreadCase(
      FIXTURE_IMPORT +
        `const opts = apiKeysQueryOptions({ projectRef: 'x' })\nexport const a = { ...opts, enabled: true }`
    ),
    // Namespace import member call.
    spreadCase(
      `import * as granted from './granted'\nexport const a = { ...granted.apiKeysQueryOptions({ projectRef: 'x' }), enabled: true }`
    ),
    // Renamed import.
    spreadCase(
      `import { apiKeysQueryOptions as getKeys } from './granted'\nexport const a = { ...getKeys({ projectRef: 'x' }), enabled: true }`
    ),
    // Local wrapper returning the factory result.
    spreadCase(
      FIXTURE_IMPORT +
        `const wrapped = (projectRef: string) => apiKeysQueryOptions({ projectRef })\nexport const a = { ...wrapped('x'), enabled: true }`
    ),
    // Calling the helper directly.
    spreadCase(
      FIXTURE_IMPORT +
        `export const a = { ...grantedQueryOptions({ queryKey: ['x'], queryFn: undefined }), enabled: true }`
    ),
    // Object.assign, as target or as source.
    spreadCase(
      FIXTURE_IMPORT +
        `const opts = apiKeysQueryOptions({ projectRef: 'x' })\nexport const a = Object.assign(opts, { enabled: true })`
    ),
    spreadCase(
      FIXTURE_IMPORT +
        `const opts = apiKeysQueryOptions({ projectRef: 'x' })\nexport const a = Object.assign({}, opts, { enabled: true })`
    ),
  ],
})
