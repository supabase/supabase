import { describe, expect, test } from '@jest/globals'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'
import { withMetadata } from '../test/util'
import { interpretPrompt } from './llm'
import { FunctionUnavailableError } from './runtime'

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

describe('single stage llm', () => {
  test.concurrent('digits of pi', async () => {
    const { exports, source, error } = await interpretPrompt(openai, [
      {
        role: 'user',
        content: 'list the first 10 digits of pi as an array',
      },
    ])

    withMetadata({ source, exports }, () => {
      if (error) {
        throw error
      }

      const { default: output } = exports
      expect(output).toStrictEqual([3, 1, 4, 1, 5, 9, 2, 6, 5, 3])
    })
  })

  test.concurrent('complex math using digits of pi', async () => {
    const { exports, source, error } = await interpretPrompt(openai, [
      {
        role: 'user',
        content: 'add every other digit from the first 10 digits of pi',
      },
    ])

    withMetadata({ source, exports }, () => {
      if (error) {
        throw error
      }

      const { default: output } = exports
      expect(output).toBe(19)
    })
  })

  test.concurrent('solve quadratic equation', async () => {
    const { exports, source, error } = await interpretPrompt(openai, [
      {
        role: 'user',
        content: 'solve for x: (2x + 3)^2 = 25',
      },
    ])

    withMetadata({ source, exports }, () => {
      if (error) {
        throw error
      }

      const { default: output } = exports
      expect(output).toStrictEqual([1, -4])
    })
  })

  test.concurrent('count words', async () => {
    const { exports, source, error } = await interpretPrompt(openai, [
      {
        role: 'user',
        content: codeBlock`
          how many words are there in the paragraph below?

          On a sunny day, Maria crafted spicy tacos with fresh salsa.
          Friends gathered, tasted, and celebrated, declaring her creation the best in town.
          Happiness filled the air.
        `,
      },
    ])

    withMetadata({ source, exports }, () => {
      if (error) {
        throw error
      }

      const { default: output } = exports
      expect(output).toBe(27)
    })
  })

  test.concurrent('async function binding', async () => {
    const { exports, source, error } = await interpretPrompt(
      openai,
      [
        {
          role: 'user',
          content: 'what is the weather like in singapore?',
        },
      ],
      {
        getWeather: {
          description: 'Gets the weather in the specified city.',
          typeDef: '(city: string): Promise<string>',
          fn: async (_city: string) => new Promise((r) => setTimeout(() => r('hot'), 50)),
        },
      }
    )

    withMetadata({ source, exports }, () => {
      if (error) {
        throw error
      }

      const { default: output } = exports
      expect(output).toBe('hot')
    })
  })

  test.concurrent('function unavailable throws', async () => {
    const { exports, source, error } = await interpretPrompt(openai, [
      {
        role: 'user',
        content: 'what is the weather like in singapore?',
      },
    ])

    withMetadata({ source, exports }, () => {
      expect(error).not.toBeUndefined()
    })
  })

  test.concurrent('function call to another LLM', async () => {
    const { exports, source, error } = await interpretPrompt(
      openai,
      [
        {
          role: 'user',
          content: codeBlock`
            Extract the nouns from this text and sort them alphabetically (case insensitive):

            On a sunny day, Maria crafted spicy tacos with fresh salsa.
            Friends gathered, tasted, and celebrated, declaring her creation the best in town.
            Happiness filled the air.
          `,
        },
      ],
      {
        getNouns: {
          description: 'Returns a list of nouns in a paragraph.',
          typeDef: '(text: string): Promise<string[]>',
          fn: async (text: string) => {
            const chatCompletion = await openai.chat.completions.create({
              model: 'gpt-4o-2024-05-13',
              messages: [
                {
                  role: 'system',
                  content: codeBlock`
                    Extract the nouns from this text and return in the following JSON format:
                    { "nouns": [...] }
                  `,
                },
                { role: 'user', content: text },
              ],
              response_format: {
                type: 'json_object',
              },
              max_tokens: 1024,
              temperature: 0,
            })

            const [firstChoice] = chatCompletion.choices
            const response = firstChoice.message.content

            if (!response) {
              throw new Error('Failed to extract nouns')
            }

            const { nouns } = JSON.parse(response)

            return nouns
          },
        },
      }
    )

    withMetadata({ source, exports }, () => {
      if (error) {
        throw error
      }

      const { default: output } = exports
      expect(output).toStrictEqual([
        'air',
        'creation',
        'day',
        'Friends',
        'Happiness',
        'Maria',
        'salsa',
        'tacos',
        'town',
      ])
    })
  })
})

async function getAssistantResponse(
  messages: ChatCompletionMessageParam[],
  exports: Record<string, any>
) {
  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-05-13',
    messages: [
      ...messages,
      {
        role: 'user',
        content: codeBlock`
          <internal>
          I interpreted the user's query and produced the following outputs:
          ${JSON.stringify(exports)}

          Use _only_ these these values to respond to the user's query (even if you think you know better).
          </internal>
        `,
      },
    ],
    max_tokens: 1024,
    temperature: 0,
  })

  const [firstChoice] = chatCompletion.choices

  const response = firstChoice.message.content

  return response
}

async function getAssistantResponseWithoutInterpreter(messages: ChatCompletionMessageParam[]) {
  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-05-13',
    messages,
    max_tokens: 1024,
    temperature: 0,
  })

  const [firstChoice] = chatCompletion.choices

  const response = firstChoice.message.content

  return response
}
