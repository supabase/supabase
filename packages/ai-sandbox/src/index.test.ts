import { describe, expect, test } from '@jest/globals'
import { executeJS } from '.'
import { codeBlock } from 'common-tags'

describe('execute js', () => {
  test('exports', async () => {
    const { exports, error } = await executeJS(codeBlock`
      export const output = 'test';
    `)

    if (error) {
      throw error
    }

    expect(exports.output).toBe('test')
  })

  test('imports', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        import { value } from 'my-lib';
        export const output = value;
      `,
      {
        modules: {
          'my-lib': codeBlock`
            export const value = 'test';
          `,
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe('test')
  })

  test('top-level await', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        async function doStuff() {
          await new Promise(r => setTimeout(r, 0));
          return 'test';
        }

        export const output = await doStuff();
      `
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe('test')
  })

  test('top-level throw', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        throw new Error('test')
      `
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.message).toBe('test')
  })

  test('top-level async throw', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        await Promise.resolve()
        throw new Error('test')
      `
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.message).toBe('test')
  })

  test('interrupt during sync code', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        while (true) {
          true;
        }
      `
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.name).toBe('InternalError')
    expect(error.message).toBe('interrupted')
  })

  test('url module loading', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        import { chunk } from 'https://esm.sh/lodash-es';

        export const output = chunk(['a', 'b', 'c', 'd'], 2);
      `,
      {
        urlModuleWhitelist: ['https://esm.sh/lodash-es', 'https://esm.sh/v135/lodash-es'],
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toStrictEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})
