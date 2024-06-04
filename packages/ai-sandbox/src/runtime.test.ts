import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import { executeJS } from './runtime'

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
    const { error } = await executeJS(
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
    const { error } = await executeJS(
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
    const { error } = await executeJS(
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

  test('function binding with string arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = ping('test');
      `,
      {
        expose: {
          ping(value: string) {
            expect(typeof value === 'string').toBe(true)
            return `pong: ${value}`
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe('pong: test')
  })

  test('function binding with number arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = ping(3);
      `,
      {
        expose: {
          ping(value: number) {
            expect(typeof value === 'number').toBe(true)
            return value + 5
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe(8)
  })

  test('function binding with boolean arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = ping(true);
      `,
      {
        expose: {
          ping(value: boolean) {
            expect(typeof value === 'boolean').toBe(true)
            return !value
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe(false)
  })

  test('function binding with object arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = ping({ a: 123 });
      `,
      {
        expose: {
          ping(value: Record<string, number>) {
            expect(typeof value === 'object').toBe(true)
            return { ...value, b: 456 }
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toStrictEqual({ a: 123, b: 456 })
  })

  test('function binding with array arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = ping([1, 2, 3]);
      `,
      {
        expose: {
          ping(value: number[]) {
            expect(Array.isArray(value)).toBe(true)
            return [...value, 4, 5, 6]
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toStrictEqual([1, 2, 3, 4, 5, 6])
  })

  test('function binding with promise arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = await ping(Promise.resolve(['test']));
      `,
      {
        expose: {
          async ping(promise: Promise<void>) {
            expect(promise).toBeInstanceOf(Promise)

            const value = await promise
            return `pong: ${JSON.stringify(value)}`
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe('pong: ["test"]')
  })

  test('function binding with rejected promise arg', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = await ping(Promise.reject(new Error('test')));
      `,
      {
        expose: {
          async ping(promise: Promise<void>) {
            const value = await promise
            return `pong: ${value}`
          },
        },
      }
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.message).toBe('test')
  })

  test('function binding with function arg throws error', async () => {
    const { error } = await executeJS(
      codeBlock`
        export const output = ping(() => true);
      `,
      {
        expose: {
          ping(cb: () => void) {
            cb()
          },
        },
      }
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.message).toBe("Function '() => true' cannot be serialized from the VM")
  })

  test('function binding that throws error', async () => {
    const { error } = await executeJS(
      codeBlock`
        export const output = ping(true);
      `,
      {
        expose: {
          ping(_value: boolean) {
            throw new Error('test')
          },
        },
      }
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.message).toBe('test')
  })

  test('function binding returning promise that resolves', async () => {
    const { exports, error } = await executeJS(
      codeBlock`
        export const output = await ping(true);
      `,
      {
        expose: {
          async ping(value: boolean) {
            return !value
          },
        },
      }
    )

    if (error) {
      throw error
    }

    expect(exports.output).toBe(false)
  })

  test('function binding returning promise that rejects', async () => {
    const { error } = await executeJS(
      codeBlock`
        export const output = await ping(true);
      `,
      {
        expose: {
          async ping(_value: boolean) {
            throw new Error('test')
          },
        },
      }
    )

    if (!error) {
      throw new Error('Expected error')
    }

    expect(error.message).toBe('test')
  })
})
