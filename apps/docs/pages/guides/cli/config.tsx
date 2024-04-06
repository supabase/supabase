import Head from 'next/head'
import ReactMarkdown from 'react-markdown'

import { CodeBlock, cn } from 'ui'

import { Heading } from '~/components/CustomHTMLElements'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { MainSkeleton } from '~/layouts/MainSkeleton'
import { Parameter } from '~/lib/refGenerator/refTypes'
import specFile from '~/spec/cli_v1_config.yaml' assert { type: 'yml' }

// Parameters are grouped on the page by tag
const tocList = []
const content = specFile.info.tags.map((tag) => {
  tocList.push({ text: tag.title, link: `${tag.id}-config`, level: 2 })
  return (
    <div>
      <Heading tag="h2">{tag.title} Config</Heading>
      {specFile.parameters
        .filter((param: Parameter) => param.tags[0] === tag.id)
        .map((parameter: Parameter) => {
          tocList.push({ text: parameter.id, link: `#${parameter.id}`, level: 3 })
          return <Info parameter={parameter} />
        })}
    </div>
  )
})

export default function Config() {
  return (
    <>
      <Head>
        <title>Supabase CLI config</title>
      </Head>
      <MainSkeleton menuId={MenuId.Cli}>
        <div className="grid grid-cols-12 relative gap-4 px-5 max-w-7xl mx-auto py-16">
          <div className="relative col-span-12 md:col-span-9 transition-all ease-out duration-100">
            <div className="w-full prose">
              <h1>CLI configuration</h1>
              <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-300 to-brand my-8"></div>
              <ReactMarkdown>{specFile.info.description}</ReactMarkdown>
              <div>{content}</div>
            </div>
          </div>
          <GuidesTableOfContents
            overrideToc={tocList}
            className={cn(
              'col-span-3 self-start',
              'hidden md:block md:col-span-3',
              'sticky top-[calc(var(--mobile-header-height,40px)+2rem)] lg:top-[calc(var(--desktop-header-height,60px)+2rem)]',
              'max-h-[calc(100vh-60px-5rem)]'
            )}
          />
        </div>
      </MainSkeleton>
    </>
  )
}

function Info({ parameter }: { parameter: Parameter }) {
  return (
    <div className="mt-8">
      <div>
        <Heading tag="h3" parseAnchors={false} customAnchor={parameter.id}>
          <code>{parameter.title}</code>
        </Heading>

        <div className="border-b pb-8" key={parameter.id}>
          <div className=" mb-16">
            <div>
              <table className="table-auto">
                <thead>
                  <tr>
                    <th className="text-left">Name</th>
                    <th className="text-left">Default</th>
                    <th className="text-left">Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{parameter.id}</td>
                    <td>{parameter.default ? parameter.default.toString() : 'None'}</td>
                    <td>{parameter.required.toString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mb-4 scroll-mt-16 mt-0 ">
              <p className="text-sm font-bold uppercase">Description</p>
              <ReactMarkdown>{parameter.description}</ReactMarkdown>
            </div>
            {parameter.usage && (
              <div className="mb-4 scroll-mt-16 mt-0 ">
                <p className="text-sm font-bold uppercase">Usage</p>
                <CodeBlock className="useless-code-block-class" language="py">
                  {parameter.usage}
                </CodeBlock>
              </div>
            )}
            {parameter.links && (
              <div>
                <p className="text-sm font-bold uppercase">See also</p>
                <ul>
                  {parameter.links.map((link) => (
                    <li key={link.link}>
                      <a href={link.link}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
