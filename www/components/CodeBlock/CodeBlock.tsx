import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import monokaiCustomTheme from 'data/CodeEditorTheme'
import CodeBlockStyles from './CodeBlock.module.css'
import { Button, IconCopy } from '@supabase/ui'
import CopyToClipboard from 'react-copy-to-clipboard'

interface Props {
  lang: 'js'
  code: 'string'
  startingLineNumber?: number
  hideCopy?: boolean
}
function CodeBlock(props: Props) {
  // const {
  //   lang = 'js',
  //   code,
  //   startingLineNumber = 1
  // } = props

  SyntaxHighlighter.registerLanguage('javascript', js)

  return (
    <div className="relative">
      <SyntaxHighlighter
        // startingLineNumber={startingLineNumber}
        language="javascript"
        style={monokaiCustomTheme}
        className={CodeBlockStyles['code-block']}
        customStyle={{
          padding: 0,
          // paddingTop: '32px',
          fontSize: 12,
          lineHeight: 1.2,
          borderTop: '1px solid #393939',
          background: '#181818',
        }}
        showLineNumbers
        lineNumberContainerStyle={{
          paddingTop: '128px',
        }}
        lineNumberStyle={{
          minWidth: '48px',
          background: '#1e1e1e',
          paddingLeft: '21px',
          marginRight: '12px',
          color: '#828282',
          fontSize: 12,
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
      >
        {props.code}
      </SyntaxHighlighter>
      {!props.hideCopy && (
        <div className="absolute right-2 top-2 dark">
          <CopyToClipboard text={props.code}>
            <Button type="outline" icon={<IconCopy />}>
              Copy
            </Button>
          </CopyToClipboard>
        </div>
      )}
    </div>
  )
}

export default CodeBlock
