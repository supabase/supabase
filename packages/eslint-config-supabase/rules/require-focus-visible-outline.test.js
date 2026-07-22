/**
 * Unit tests for require-focus-visible-outline.
 *
 * Run: node rules/require-focus-visible-outline.test.js
 */

const { RuleTester } = require('eslint')
const rule = require('./require-focus-visible-outline')

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})

ruleTester.run('require-focus-visible-outline', rule, {
  valid: [
    { code: '<button className="focus-ring outline-none">Save</button>' },
    { code: '<div className="focus-inset outline-hidden">Row</div>' },
    {
      code: '<input className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" />',
    },
    { code: '<button className="focus:outline-hidden focus:ring-1">Legacy</button>' },
    {
      code: '<div className="group-focus-visible:ring-2 outline-none">Group</div>',
    },
    {
      code: '<div className="has-[:focus-visible]:ring-2 outline-hidden">Input group</div>',
    },
    {
      code: '<div className="has-[input:focus-visible]:ring-2 outline-none">Input group</div>',
    },
    { code: '<button className="rounded-md px-2">No outline utility</button>' },
    {
      code: `
        function Example() {
          return <button className={cn('outline-none', 'focus-ring')}>Save</button>
        }
      `,
    },
    {
      code: '<button className={`outline-none focus-ring`}>Save</button>',
    },
  ],
  invalid: [
    {
      code: '<button className="outline-none">Save</button>',
      errors: [{ messageId: 'bareOutlineNone' }],
    },
    {
      code: '<div className="outline-hidden hover:bg-accent">Item</div>',
      errors: [{ messageId: 'bareOutlineNone' }],
    },
    {
      code: '<button className="focus:outline-none">Save</button>',
      errors: [{ messageId: 'bareOutlineNone' }],
    },
    {
      code: `
        function Example() {
          return <button className={cn('outline-hidden', 'hover:bg-accent')}>Save</button>
        }
      `,
      errors: [{ messageId: 'bareOutlineNone' }],
    },
    {
      code: '<div className="[&>textarea]:outline-hidden!">Wrapper</div>',
      errors: [{ messageId: 'bareOutlineNone' }],
    },
  ],
})

console.log('require-focus-visible-outline tests passed')
