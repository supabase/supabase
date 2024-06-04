import { codeBlock } from 'common-tags'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { Code } from 'mdast-util-from-markdown/lib'
import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam } from 'openai/resources'
import { ExecuteOptions, executeJS } from './runtime'

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
    content: codeBlock`
      You are a JavaScript code interpreter. Given the following JavaScript functions
      and user prompt, generate the JavaScript code to accomplish that task.

      Here are the requirements:
      - Use modern ES2020 syntax
      - You are writing code for ES modules, so use imports and exports
      - Top level await is supported, so use it if needed
      - Output JavaScript and nothing else, wrapped in a markdown code block
      - Use Math.* functions when performing math operations
      - Create your own functions as necessary to keep the code modular
      - Prefer creating more generic functions that are reusable than single purpose functions
          Example prompt: count to 10
          Bad response:
          \`\`\`javascript
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
          \`\`\`javascript
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
          \`\`\`javascript
          async function getUnfinishedTodos() {
            return getTodos(false);
          }

          export const unfinishedTodos = await getUnfinishedTodos();
          \`\`\`
          Good response:
          \`\`\`javascript
          export const unfinishedTodos = await getTodos(false);
          \`\`\`
      - Use as little functions/variables as possible
        (ie. don't create a function or variable that wraps another - just call the function/variable directly)
      - If applicable, break the problem into intermediate steps and export each step along the way

      Your results should be exported like so:
      \`\`\`javascript
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

      If the function you need is not available, throw a
      \`new FunctionUnavailableError('<description of what was unavailable>')\`
      which is available in \`globalThis\`.
      _Important:_ \`fetch\` is not available, do not make up functions or imports that are not provided.
    `,
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
    throw new Error('Expected a response from the LLM')
  }

  const [source] = extractMarkdownCodeBlock(response, 'javascript')

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

function extractMarkdownCodeBlock(markdown: string, language?: string) {
  const mdTree = fromMarkdown(markdown)

  return mdTree.children
    .filter(
      (node): node is Code =>
        node.type === 'code' && (language === undefined || node.lang === language)
    )
    .map(({ value }) => value)
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
