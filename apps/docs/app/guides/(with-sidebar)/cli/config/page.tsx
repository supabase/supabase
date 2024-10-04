import ReactMarkdown from 'react-markdown'
import { CodeBlock } from 'ui'
import { Heading } from 'ui/src/components/CustomHTMLElements'
import { type TOCHeader } from '~/components/GuidesTableOfContents'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import type { Parameter } from '~/lib/refGenerator/refTypes'
import specFile from '~/spec/cli_v1_config.yaml' assert { type: 'yml' }

const meta = {
  title: 'Supabase CLI config',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/cli/config',
  meta,
}))

const tocList: TOCHeader[] = []
const content = specFile.info.tags.map((tag: { id: string; title: string }, id: number) => {
  tocList.push({ id: `${id}`, text: tag.title, link: `${tag.id}-config`, level: 2 })
  return (
    <div>
      <Heading tag="h2">{tag.title} Config</Heading>
      {specFile.parameters
        .filter((param: Parameter) => param.tags && param.tags[0] === tag.id)
        .map((parameter: Parameter, id: number) => {
          tocList.push({ id: `${id}`, text: parameter.id, link: `#${parameter.id}`, level: 3 })
          return <Info parameter={parameter} />
        })}
    </div>
  )
})

const Config = () => {
  const editLink = newEditLink('supabase/supabase/blob/master/apps/docs/spec/cli_v1_config.yaml')

  return (
    <GuideTemplate meta={meta} editLink={editLink}>
      <ReactMarkdown>{specFile.info.description}</ReactMarkdown>
      <div>{content}</div>
    </GuideTemplate>
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
export { generateMetadata }
