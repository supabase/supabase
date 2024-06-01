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
        'my-lib': codeBlock`
          export const value = 'test';
        `,
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

    expect(error?.message).toBe('test')
  })

  test('top-level async throw', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        await Promise.resolve()
        throw new Error('test')
      `
    )

    expect(error?.message).toBe('test')
  })
})
