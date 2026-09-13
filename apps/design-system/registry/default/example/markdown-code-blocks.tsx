import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownCodeBlocksDemo() {
  return (
    <Markdown codeBlock>{`\`\`\`javascript
const greeting = 'Hello, World!'
console.log(greeting)
\`\`\`

\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\``}</Markdown>
  )
}
