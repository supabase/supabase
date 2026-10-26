import { createRequire } from 'node:module'
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
