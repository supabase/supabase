import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import CopyToClipboard from 'react-copy-to-clipboard'
import { examples } from 'data/CodeExamples'
import monokaiCustomTheme from 'data/CodeEditorTheme'

SyntaxHighlighter.registerLanguage('javascript', js)

const ClipboardIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="css-i6dzq1"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
)

const CopiedIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="css-i6dzq1">
      <polyline points="20 6 9 17 4 12" />
    </svg>
)

const CodeExamples = () => {
  const [example, setExample] = useState('createUserExample')
  const [copied, setCopied] = useState(false)

  const exampleList = ['createUserExample', 'subscribeExample', 'readExample', 'createExample', 'updateExample']

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
          mb-2 rounded-md border border-gray-200 dark:border-dark-200 px-4 py-2 text-xs font-medium text-gray transition
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent sm:text-sm sm:w-auto
          ${example === id ? ' border-gray-900 bg-dark-600 dark:bg-white text-white dark:text-dark-600' : ' hover:bg-gray-200 dark:hover:text-black'}
          dark:text-white lg:w-full
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
    <div className="grid grid-cols-12 gap-2 xl:gap-8">
      <div className="col-span-12 text-center lg:col-span-3 lg:hidden">{buttons}</div>
      <div className="col-span-12 lg:col-span-9">
        <div className="rounded-md rounded-b-lg bg-dark-600 dark:bg-dark-700">
          <div className="p-2 pl-5 flex justify-between items-center">
            <p className="text-sm truncate mr-2 sm:text-base text-dark-100">
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
                <span className="hidden sm:block">{copied ? 'Copied!' : 'Copy code'}</span>
                <span className="block sm:hidden">
                  {copied ? <CopiedIcon /> : <ClipboardIcon />}
                </span>
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
      <div className="col-span-12 text-center hidden lg:col-span-3 lg:block">{buttons}</div>
    </div>
  )
}

export default CodeExamples
