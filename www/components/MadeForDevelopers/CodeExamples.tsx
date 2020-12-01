import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import CopyToClipboard from 'react-copy-to-clipboard'
import { examples } from 'data/CodeExamples'

var monokaiCustomTheme = {
  "hljs": {
    "display": "block",
    "overflowX": "auto",
    "padding": "0.5em",
    "background": "#272822",
    "color": "#ddd"
  },
  "hljs-tag": {
    "color": "#569cd6"
  },
  "hljs-keyword": {
    "color": "#569cd6",
    "fontWeight": "bold"
  },
  "hljs-selector-tag": {
    "color": "#569cd6",
    "fontWeight": "bold"
  },
  "hljs-literal": {
    "color": "#569cd6",
    "fontWeight": "bold"
  },
  "hljs-strong": {
    "color": "#569cd6"
  },
  "hljs-name": {
    "color": "#569cd6"
  },
  "hljs-code": {
    "color": "#66d9ef"
  },
  "hljs-class .hljs-title": {
    "color": "white"
  },
  "hljs-attribute": {
    "color": "#bf79db"
  },
  "hljs-symbol": {
    "color": "#bf79db"
  },
  "hljs-regexp": {
    "color": "#bf79db"
  },
  "hljs-link": {
    "color": "#bf79db"
  },
  "hljs-string": {
    "color": "#05b560"
  },
  "hljs-bullet": {
    "color": "#05b560"
  },
  "hljs-subst": {
    "color": "#05b560"
  },
  "hljs-title": {
    "color": "#05b560",
    "fontWeight": "bold"
  },
  "hljs-section": {
    "color": "#05b560",
    "fontWeight": "bold"
  },
  "hljs-emphasis": {
    "color": "#05b560"
  },
  "hljs-type": {
    "color": "#05b560",
    "fontWeight": "bold"
  },
  "hljs-built_in": {
    "color": "#05b560"
  },
  "hljs-builtin-name": {
    "color": "#05b560"
  },
  "hljs-selector-attr": {
    "color": "#05b560"
  },
  "hljs-selector-pseudo": {
    "color": "#05b560"
  },
  "hljs-addition": {
    "color": "#05b560"
  },
  "hljs-variable": {
    "color": "#05b560"
  },
  "hljs-template-tag": {
    "color": "#05b560"
  },
  "hljs-template-variable": {
    "color": "#05b560"
  },
  "hljs-comment": {
    "color": "#75715e"
  },
  "hljs-quote": {
    "color": "#75715e"
  },
  "hljs-deletion": {
    "color": "#75715e"
  },
  "hljs-meta": {
    "color": "#75715e"
  },
  "hljs-doctag": {
    "fontWeight": "bold"
  },
  "hljs-selector-id": {
    "fontWeight": "bold"
  }
};

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
          m-1 mb-4 rounded-md border border-gray-200 dark:border-dark-200 px-4 py-2 text-base font-medium text-gray transition
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent sm:w-auto sm:text-sm
          ${example === id ? ' border-gray-900 bg-dark-600 dark:bg-white text-white dark:text-dark-600' : ' hover:bg-gray-200 dark:hover:text-black'}
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
      <div className="col-span-12 xl:col-span-8 xl:col-start-3">
        <div className="rounded bg-dark-500">
          <div className="p-2 pl-5 flex justify-between items-center">
          <p className="text-base text-dark-100">
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
              className="inline-flex items-center px-2.5 py-1.5 border border-dark-300 shadow-sm text-xs font-medium rounded text-dark-100 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </CopyToClipboard>
          </div>
          <SyntaxHighlighter
            // startingLineNumber={3}
            language="javascript"
            style={monokaiCustomTheme}
            className="rounded-b-lg"
            customStyle={{
              padding: 0,
              // paddingTop: '32px',
              fontSize: 12,
              lineHeight: 1.2,
              borderTop: '1px solid #393939',
              background: '#181818'
            }}
            showLineNumbers
            lineNumberContainerStyle={{
              paddingTop: '128px'
            }}
            lineNumberStyle={{
              minWidth: '48px',
              background: '#1e1e1e',
              paddingLeft: '21px',
              color: '#828282',
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
