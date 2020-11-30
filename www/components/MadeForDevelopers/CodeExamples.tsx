import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import rainbow from 'react-syntax-highlighter/dist/cjs/styles/hljs/rainbow'
import CopyToClipboard from 'react-copy-to-clipboard'
import { examples } from 'data/CodeExamples'

SyntaxHighlighter.registerLanguage('javascript', js)

const CodeExamples = () => {
  const [example, setExample] = useState('subscribeExample')
  const [copied, setCopied] = useState(false)

  const exampleList = ['subscribeExample', 'readExample', 'createExample', 'updateExample']

  const lang = 'javascript'

  function handleClick(key: string) {
    setExample(key)
    setCopied(false)
  }

  const buttons = exampleList.map((id) => {
    return (
      <button
        type="button"
        key={id + "-button"}
        onClick={() => handleClick(id)}
        className={`
          m-1 mb-4 rounded-md border border-gray-200 px-4 py-2 text-base font-medium text-gray transition
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent sm:w-auto sm:text-sm
          ${example === id ? ' border-gray-900 bg-gray-900 text-white' : ' hover:bg-gray-200 dark:hover:text-black'}
          dark:text-white
      `}
      >
        {
          // @ts-ignore
          examples[id].name
        }
      </button>
    )
  })

  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-12 text-center">
        {buttons}
      </div>
      <div className="col-span-8 col-start-3">
        <div className="rounded" style={{ background: '#474949' }}>
          <div className="p-2 pl-5 flex justify-between items-center">
          <p className="text-base text-gray-400 text-white">
            {
              // @ts-ignore
              examples[example].description
            }
          </p>
          <CopyToClipboard
            text={
              // @ts-ignore
              examples[example].code[lang]
            }
            onCopy={() => setCopied(true)}
          >
            <button
              type="button"
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-500 shadow-sm text-xs font-medium rounded text-gray-300 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </CopyToClipboard>
          </div>
          <SyntaxHighlighter
            // startingLineNumber={3}
            language="javascript"
            style={rainbow}
            className="rounded-b-lg"
            customStyle={{
              padding: 0,
              // paddingTop: '32px',
              fontSize: 12,
              lineHeight: 1.2,
              borderTop: '1px solid #676767',
            }}
            showLineNumbers
            lineNumberContainerStyle={{
              background: 'red',
              paddingTop: '128px',
            }}
            lineNumberStyle={{
              minWidth: '48px',
              backgroundColor: '#3d3d3d',
              paddingLeft: '21px',
              color: '#8c999f',
              fontSize: 12,
              paddingTop: '4px',
              paddingBottom: '4px',
            }}
          >
            {
              // @ts-ignore
              examples[example].code[lang]
            }
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}

export default CodeExamples
