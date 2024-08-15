import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import CopyToClipboard from 'react-copy-to-clipboard'
import {
  createUserExample,
  subscribeExample,
  readExample,
  createExample,
  updateExample,
  ExampleProps,
} from 'data/CodeExamples'
import monokaiCustomTheme from 'data/CodeEditorTheme'
import { Button, Space, Tabs } from 'ui'

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
    className="css-i6dzq1"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const CodeExamples = () => {
  const [example, setExample] = useState('createUserExample')
  const [copied, setCopied] = useState(false)

  type exampleListProps = {
    [key: string]: ExampleProps
  }

  const exampleList: exampleListProps = {
    createUserExample,
    subscribeExample,
    readExample,
    createExample,
    updateExample,
  }

  const lang = 'javascript'

  function handleClick(key: string) {
    setExample(key)
    setCopied(false)
  }

  const Buttons = () => (
    <Space direction="vertical" size={1}>
      {Object.values(exampleList).map((x, i) => {
        return (
          <Button
            block
            type={'outline'}
            size="small"
            key={x.id}
            onClick={() => handleClick(x.id)}
            style={
              example === x.id
                ? {
                    background: 'white',
                    color: '#3d3d3d',
                  }
                : undefined
            }
          >
            {x.name}
          </Button>
        )
      })}
    </Space>
  )

  const TabNav = () => (
    <Tabs
      key="mobile-tabs"
      scrollable
      onClick={(id: string) => handleClick(id)}
      activeId={example}
      type="underlined"
    >
      {Object.values(exampleList).map((x, i) => {
        return (
          <Tabs.Panel id={x.id} label={x.name} key={i}>
            <span></span>
          </Tabs.Panel>
        )
      })}
    </Tabs>
  )

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 xl:gap-8">
        <div className="col-span-12 text-center lg:col-span-3 lg:hidden">{<TabNav />}</div>
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-surface-100 rounded-md rounded-b-lg">
            <div className="flex items-center justify-between p-2 pl-5">
              <p className="text-dark-100 mr-2 truncate text-sm sm:text-base">
                {exampleList[example].description}
              </p>
              <div className="dark">
                <CopyToClipboard
                  text={exampleList[example].code[lang]}
                  onCopy={() => setCopied(true)}
                >
                  <Button type="outline" icon={copied ? <CopiedIcon /> : <ClipboardIcon />}>
                    <span className="hidden sm:block">{copied ? 'Copied!' : 'Copy code'}</span>
                  </Button>
                </CopyToClipboard>
              </div>
            </div>
            <SyntaxHighlighter
              language="javascript"
              // @ts-ignore
              style={isDarkTheme ? monokaiCustomTheme.dark : monokaiCustomTheme.light}
              className="rounded-b-lg"
              customStyle={{
                padding: 0,
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
              {exampleList[example].code[lang]}
            </SyntaxHighlighter>
          </div>
        </div>
        <div className="col-span-12 hidden text-center lg:col-span-3 lg:block">{<Buttons />}</div>
      </div>
    </div>
  )
}

export default CodeExamples
