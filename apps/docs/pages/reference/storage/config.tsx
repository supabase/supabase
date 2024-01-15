import specFile from '~/spec/storage_v0_config.yaml' assert { type: 'yml' }
import { Parameter } from '~/lib/refGenerator/refTypes'

import ReactMarkdown from 'react-markdown'

// Parameters are grouped on the page by tag
const TAGS = ['general', 'multitenant']
// console.log(specFile)
export default function Config() {
  return (
    <div>
      <div className="flex my-16">
        <div className="w-full prose">
          <h1 className="text-4xl mb-16">{specFile.info.title} Configuration</h1>
          <ReactMarkdown>{specFile.info.description}</ReactMarkdown>
          <div>
            {TAGS.map((tag) =>
              specFile.parameters
                .filter((param: Parameter) => param.tags[0] === tag)
                .map((parameter: Parameter, index) => (
                  <div>
                    {index === 0 && <h2 className="text-xl capitalize">{tag} Settings</h2>}
                    <div className="mt-8">
                      <div>
                        <h2 className="text-xl font-medium text-foreground font-mono">
                          <span className="mr-2">$</span>
                          {parameter.title}
                        </h2>
                        <div className="grid" id={parameter.id}>
                          <div className="border-b pb-8" key={parameter.id}>
                            <div className=" mb-16">
                              <p className="mb-4 scroll-mt-16 mt-0 text-foreground-light text-base">
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
    </div>
  )
}
