import {
  CoreMessage,
  CoreToolMessage,
  TextPart,
  ToolCallPart,
  formatStreamPart,
  nanoid,
  streamText,
} from 'ai'
import { codeBlock } from 'common-tags'
import { RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { Code } from 'mdast-util-from-markdown/lib'
import { toMarkdown } from 'mdast-util-to-markdown'
import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam } from 'openai/resources'
import { ExecuteOptions, executeJS } from './runtime'

export type { Code } from 'mdast-util-from-markdown/lib'
export { toMarkdown } from 'mdast-util-to-markdown'

export type FunctionBinding = {
  description: string
  typeDef: string
  fn: (...args: any[]) => any
}

export async function interpretPrompt(
  openai: OpenAI,
  messages: ChatCompletionMessageParam[],
  functionBindings: Record<string, FunctionBinding> = {}
) {
  const systemMessage: ChatCompletionSystemMessageParam = {
    role: 'system',
    content: buildSystemPrompt({ functionBindings }),
  }

  const messagesExcludingSystem = messages.filter((message) => message.role !== 'system')

  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-05-13',
    messages: [systemMessage, ...messagesExcludingSystem],
    max_tokens: 1024,
    temperature: 0,
  })

  const [firstChoice] = chatCompletion.choices

  const response = firstChoice.message.content

  if (!response) {
    return {
      error: new Error('Expected a response from the LLM'),
      exports: undefined,
      source: undefined,
      systemPrompt: undefined,
    }
  }

  console.log(response)

  const [source] = extractMarkdownCodeBlock(response, 'javascript+interpret')

  if (!source) {
    return {
      error: new Error('Interpreter was not used'),
      exports: undefined,
      source: undefined,
      systemPrompt: undefined,
    }
  }

  const expose: ExecuteOptions['expose'] = Object.entries(functionBindings).reduce(
    (merged, [name, { fn }]) => ({
      ...merged,
      [name]: fn,
    }),
    {}
  )

  const result = await executeJS(source, {
    expose,
  })

  return {
    ...result,
    source,
    systemPrompt: systemMessage.content,
  }
}

type StreamTextWithInterpreterOptions = Parameters<typeof streamText>[0] & {
  functionBindings?: Record<string, FunctionBinding>
}

export async function streamTextWithInterpreter(options: StreamTextWithInterpreterOptions) {
  const [lastMessage] = options.messages?.slice(-1) ?? []
  const isToolMode = lastMessage && lastMessage.role === 'tool'

  let system: string

  if (isToolMode) {
    system = codeBlock`
      ${options.system ?? 'You are a helpful assistant.'}
      
      Relay the tool result to the user.
    `
  } else {
    system = buildSystemPrompt({
      basePrompt: options.system,
      functionBindings: options.functionBindings,
    })
  }

  let messages: CoreMessage[] | undefined = options.messages

  console.dir({ messagesBefore: messages }, { depth: null })

  if (!isToolMode) {
    messages = messages?.reduce<CoreMessage[]>((acc, message, i) => {
      // If this message was a tool call
      if (message.role === 'assistant' && Array.isArray(message.content)) {
        const interpretToolCall = message.content.find(
          (part): part is ToolCallPart => part.type === 'tool-call' && part.toolName === 'interpret'
        )

        const textPart = message.content.find((part): part is TextPart => part.type === 'text')

        // If this tool call was our artificial "interpret" call
        // and if the previous message was a regular assistant message
        if (interpretToolCall && textPart) {
          const { source } = interpretToolCall.args as any

          const toolMessage = messages?.find(
            (message): message is CoreToolMessage =>
              message.role === 'tool' &&
              message.content.some((part) => part.toolCallId === interpretToolCall.toolCallId)
          )

          const toolResult = toolMessage?.content.find(
            (part) => part.toolCallId === interpretToolCall.toolCallId
          )

          const codeBlock: Code = {
            type: 'code',
            lang: 'javascript+interpret',
            value: source,
          }

          // Add the interpreted code to the text part as markdown code
          textPart.text += `\n${toMarkdown(codeBlock)}`

          if (toolResult) {
            const codeBlock: Code = {
              type: 'code',
              lang: 'javascript+result',
              value: JSON.stringify(toolResult.result),
            }

            textPart.text += `\n${toMarkdown(codeBlock)}`
          }

          // Exclude this tool call message from the output
          message.content = message.content.filter(
            (part) => !(part.type === 'tool-call' && part.toolName === 'interpret')
          )

          return [...acc, message]
        }
      }

      // Filter out tool results from the new message history
      if (message.role === 'tool') {
        return acc
      }

      return [...acc, message]
    }, [])
  }

  console.dir({ messagesAfter: messages }, { depth: null })

  const result = await streamText({
    ...options,
    system,
    messages,
  })

  const streamDataTransformer = new TransformStream<RootContent[], string>({
    transform: async (nodes, controller) => {
      for (const node of nodes) {
        if (node.type === 'code' && node.lang === 'javascript+interpret') {
          controller.enqueue(
            formatStreamPart('tool_call', {
              toolCallId: nanoid(),
              toolName: 'interpret',
              args: {
                language: 'javascript',
                source: node.value,
              },
            })
          )
        } else {
          const markdown = toMarkdown(node)
          controller.enqueue(formatStreamPart('text', markdown))
        }
      }
    },
  })

  const customAiStream = result.textStream
    .pipeThrough(new MarkdownStream())
    .pipeThrough(streamDataTransformer)
    .pipeThrough(new TextEncoderStream())

  return customAiStream
}

export function buildSystemPrompt({
  basePrompt = 'You are a helpful assistant.',
  functionBindings = {},
}: {
  basePrompt?: string
  functionBindings?: Record<string, FunctionBinding>
}) {
  return codeBlock`
    ${basePrompt}

    You have useful tool available: a JavaScript code interpreter called \`javascript+interpret\`.
    When you output a markdown code block with the language \`javascript+interpret\`, the code will execute automatically.

    Use \`javascript+interpret\` to perform logical operations and actions requested by the user.

    Here's how \`javascript+interpret\` works:
    - You will be given a list of JavaScript functions that are available to call (see below)
    - The JavaScript code will run behind the scenes, so when outside of the code, don't refer to it (or the functions) directly (instead say something like "computing..." / "working on it" / etc)
    - You are expected to use modern ES2020 syntax
    - You are writing code for ES modules, so use imports and exports
    - Imports and exports can not be nested in an if-statement
    - Top level await is supported, so use it if needed
    - Use Math.* functions when performing math operations or using math constants
    - Create your own functions as necessary to keep the code modular
    - Prefer creating more generic functions that are reusable than single purpose functions
        Example prompt: count to 10
        Bad response:
        \`\`\`javascript+interpret
        function countToTen() {
          const output = [];
          for (let i = 1; i <= 10; i++) {
            output.push(i);
          }
          return output.join(', ');
        }

        export const output = countToTen();
        \`\`\`
        Good response:
        \`\`\`javascript+interpret
        function countTo(digits) {
          const output = [];
          for (let i = 1; i <= n; i++) {
            output.push(i);
          }
          return output.join(', ');
        }

        export const output = countTo(10);
        \`\`\`
        
        Example prompt: get unfinished todos (with function available: \`function getTodos(isFinished: boolean): Promise<string>\`)
        Bad response:
        \`\`\`javascript+interpret
        async function getUnfinishedTodos() {
          return getTodos(false);
        }

        export const unfinishedTodos = await getUnfinishedTodos();
        \`\`\`
        Good response:
        \`\`\`javascript+interpret
        export const unfinishedTodos = await getTodos(false);
        \`\`\`
    - Use as little functions/variables as possible
      (ie. don't create a function or variable that wraps another - just call the function/variable directly)
    - If applicable, break the problem into intermediate steps and export each step along the way
    - Show your work along the way within the code (not outside the code)

    Your results should be exported like so (minus the instruction comments):
    \`\`\`javascript+interpret
    // Here you can: import modules, create functions, perform loops or other logic
    // Next export your results using _appropriate variable names_: 
    export const myDescriptiveStep = ... // call a function, etc (use a better name)
    // ... any other intermediate steps _must be exported_ and _given a suitable name_
    export const myOutput = ...  // call a function, etc (use a better name)
    export default myOutput; // then export your final output as default
    \`\`\`

    The following functions are available in \`globalThis\`:
    ${
      Object.keys(functionBindings).length > 0
        ? codeBlock`
            \`\`\`typescript
            ${Object.entries(functionBindings)
              .map(
                ([name, { description, typeDef }]) => codeBlock`
                  ${formatJsdocComment(description)}
                  ${formatFunctionDefinition(name, typeDef)}
                `
              )
              .join('\n')}
            \`\`\`
          `
        : 'Only built-in JS functions are available'
    }
    - Built-in JS functions like Math.*

    _Important:_ \`fetch\` is not available, do not make up functions or imports that are not provided.
  `
}

export function extractMarkdownCodeBlock(markdown: string, language?: string) {
  const mdTree = fromMarkdown(markdown)

  return mdTree.children
    .filter(
      (node): node is Code =>
        node.type === 'code' && (language === undefined || node.lang === language)
    )
    .map(({ value }) => value)
}

export class MarkdownStream extends TransformStream<string, RootContent[]> {
  constructor() {
    let buffer = ''
    super({
      start(controller) {
        // Any setup logic goes here.
      },
      transform(chunk, controller) {
        buffer += chunk
        console.log(chunk)
        // console.log('MarkdownStream', buffer)
        const root = fromMarkdown(buffer)

        if (root.children.length > 1) {
          const lastChild = root.children.pop()

          if (!lastChild) {
            throw new Error(`Unexpected error when parsing markdown stream. Please report this.`)
          }

          if (lastChild.position?.start?.offset === undefined) {
            throw new Error(`Node '${lastChild.type}' expected to have a start position offset`)
          }

          buffer = buffer.slice(lastChild.position.start.offset)
          // console.log('MarkdownStream', 'new buffer', buffer)
          controller.enqueue(root.children)
        }
      },
      flush(controller) {
        const root = fromMarkdown(buffer)

        if (root.children.length > 0) {
          controller.enqueue(root.children)
        }
      },
    })
  }
}

function formatJsdocComment(description: string, columnWidth = 80) {
  const lines = []

  lines.push('/**')

  chunkString(description, columnWidth).forEach((chunk) => {
    lines.push(` * ${chunk}`)
  })

  lines.push(' */')

  return lines.join('\n')
}

function formatFunctionDefinition(name: string, typeDef: string) {
  return `function ${name}${typeDef}`
}

function chunkString(string: string, size: number) {
  const words = string.split(' ')
  let currentLine = ''
  const chunks = []

  for (const word of words) {
    if ((currentLine + word).length <= size) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      chunks.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) {
    chunks.push(currentLine)
  }

  return chunks
}
