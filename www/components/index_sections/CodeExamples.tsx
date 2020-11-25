import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import rainbow from 'react-syntax-highlighter/dist/cjs/styles/hljs/rainbow'

import { examples } from './../../data/CodeExamples'

SyntaxHighlighter.registerLanguage('javascript', js)

const CodeExamples = () => {
  const [example, setExample] = useState('subscribeExample')

  const exampleList = ['subscribeExample', 'readExample', 'createExample', 'updateExample']

  const lang = 'javascript'

  function handleClick(key: string) {
    setExample(key)
  }

  const buttons = exampleList.map((id) => {
    return (
      <button
        type="button"
        onClick={() => handleClick(id)}
        className={"m-1 mb-4 rounded-md border border-gray-200 px-4 py-2 text-base font-medium text-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent sm:w-auto sm:text-sm" + (example === id ? " border-brand-100 bg-brand-100 text-brand" : " hover:bg-gray-200")}
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
        {/* <button
          type="button"
          className="mt-12 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          <svg
            className="-ml-0.5 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Explore documentation
        </button> */}
      </div>
      <div className="col-span-8 col-start-3">
        <div className="rounded" style={{ background: '#474949' }}>
          <p className="text-base text-gray-400 text-white p-2 pl-5">
            {
              // @ts-ignore
              examples[example].description
            }
          </p>
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
