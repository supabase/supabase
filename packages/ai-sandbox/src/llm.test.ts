import { describe, expect, test } from '@jest/globals'
import OpenAI from 'openai'
import { asSingleOutput, interpretPrompt } from './llm'
import { FunctionUnavailableError } from './runtime'

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

describe('single stage llm', () => {
  test('digits of pi', async () => {
    const { exports, source, error } = await interpretPrompt(
      openai,
      'list the first 10 digits of pi'
    )

    if (error) {
      throw error
    }

    console.log(source)
    const output = asSingleOutput(exports)
    expect(output).toBe('3141592653')
  })

  test('with async function binding', async () => {
    const { exports, source, error } = await interpretPrompt(
      openai,
      'what is the weather like in singapore?',
      {
        getWeather: {
          description: 'Gets the weather in the specified city.',
          typeDef: '(city: string): Promise<string>',
          fn: async (_city: string) => new Promise((r) => setTimeout(() => r('hot'), 50)),
        },
      }
    )

    if (error) {
      throw error
    }

    console.log(source)
    const output = asSingleOutput(exports)
    expect(output).toBe('hot')
  })

  test('with function unavailable', async () => {
    const { exports, source, error } = await interpretPrompt(
      openai,
      'what is the weather like in singapore?'
    )

    if (!error) {
      throw new Error('Expected error to be thrown')
    }

    console.dir(error, { depth: null, showHidden: true })

    console.log(source)
    expect(error).toBeInstanceOf(FunctionUnavailableError)
  })
})
