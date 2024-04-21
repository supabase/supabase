import { type Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import { CodeBlock, cn } from 'ui'
import { Heading } from '~/components/CustomHTMLElements'
import { type TOCHeader } from '~/components/GuidesTableOfContents'
import { Parameter } from '~/lib/refGenerator/refTypes'
import specFile from '~/spec/cli_v1_config.yaml' assert { type: 'yml' }
import { GuideTemplate } from '../../GuideTemplate'

const metadata: Metadata = {
  title: 'Supabase CLI config',
}

const tocList: TOCHeader[] = []
const content = specFile.info.tags.map((tag, id) => {
  tocList.push({ id, text: tag.title, link: `${tag.id}-config`, level: 2 })
  return (
    <div>
      <Heading tag="h2">{tag.title} Config</Heading>
      {specFile.parameters
        .filter((param: Parameter) => param.tags && param.tags[0] === tag.id)
        .map((parameter: Parameter, id) => {
          tocList.push({ id, text: parameter.id, link: `#${parameter.id}`, level: 3 })
          return <Info parameter={parameter} />
        })}
    </div>
  )
})

const Config = () => {
  const meta = {
    title: 'CLI configuration',
  }

  return (
    <>
      <GuideTemplate pathname="config" meta={meta}>
        <ReactMarkdown>{specFile.info.description}</ReactMarkdown>
        <div>{content}</div>
      </GuideTemplate>
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
                    <td>{parameter.required !== undefined && parameter.required.toString()}</td>
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

export default Config
export { metadata }
