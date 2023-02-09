// @ts-expect-error
import specFile from '~/../../spec/cli_v1_config.yaml' assert { type: 'yml' }
import { Parameter } from '~/lib/refGenerator/refTypes'
import ReactMarkdown from 'react-markdown'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { Heading } from '~/components/CustomHTMLElements'

// Parameters are grouped on the page by tag
const TAGS = ['general', 'auth', 'api', 'database', 'dashboard', 'local', 'edge-functions']

const tocList = TAGS.map((tag) =>
  specFile.parameters
    .filter((param: Parameter) => param.tags[0] === tag)
    .map((parameter) => {
      const text = parameter.id
      const link = `#${parameter.id}`
      const level = '2'
      return { text, link, level }
    })
).flat()

export default function Config() {
  return (
    <div className="grid grid-cols-12 relative gap-4">
      <div className="relative col-span-12 md:col-span-9 transition-all ease-out duration-100">
        <div className="w-full prose">
          <h1 className="">CLI configuration</h1>
          <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-8"></div>
          <ReactMarkdown>{specFile.info.description}</ReactMarkdown>
          <div>
            {TAGS.map((tag) =>
              specFile.parameters
                .filter((param: Parameter) => param.tags[0] === tag)
                .map((parameter: Parameter, index) => (
                  <div>
                    {index === 0 && <h2 className="text-xl capitalize">{tag}</h2>}
                    <div className="mt-8">
                      <div>
                        <Heading tag="h2" parseAnchors={false} customAnchor={parameter.id}>
                          <code>{parameter.title}</code>
                        </Heading>
                        <div className="grid">
                          <div className="border-b pb-8" key={parameter.id}>
                            <div className=" mb-16">
                              <p className="mb-4 scroll-mt-16 mt-0 text-scale-1100 text-base">
                                <ReactMarkdown>{parameter.description}</ReactMarkdown>
                              </p>
                              <div className="grid gap-2">
                                <div className="flex gap-2">
                                  Required: <code>{parameter.required.toString()}</code>
                                </div>
                                <div className="flex gap-2">
                                  Default:
                                  <code>
                                    {parameter.default ? parameter.default.toString() : 'None'}
                                  </code>
                                </div>
                              </div>
                            </div>
                            {parameter.links &&
                              parameter.links.map((link) => (
                                <div>
                                  <h3>See also:</h3>
                                  <li>
                                    <a href={link.link}>{link.name}</a>
                                  </li>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
      <div className="md:col-span-3">
        <div className="sticky top-20 border-l">
          <span className="block font-mono text-xs uppercase text-scale-1200 pl-5 mb-4">
            On this page
          </span>
          <GuidesTableOfContents list={tocList} />
        </div>
      </div>
    </div>
  )
}
