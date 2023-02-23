import Snippets from '../Snippets'
import CodeSnippet from '../CodeSnippet'
import Image from 'next/image'
import { useStore } from 'hooks'
import { AutoApiService } from 'data/config/project-api-query'

const libs = [
  {
    name: 'Javascript',
    url: 'https://supabase.com/docs/reference/javascript/introduction',
    icon: 'javascript',
  },
  { name: 'Flutter', url: 'https://supabase.com/docs/reference/dart/introduction', icon: 'dart' },
  {
    name: 'Python',
    url: 'https://supabase.com/docs/reference/python/introduction',
    icon: 'python',
  },
  { name: 'C#', url: 'https://supabase.com/docs/reference/csharp/introduction', icon: 'csharp' },
]

interface Props {
  autoApiService: AutoApiService
  selectedLang: string
}

export default function Introduction({ autoApiService, selectedLang }: Props) {
  const { ui } = useStore()
  const { isDarkTheme } = ui

  return (
    <>
      <h2 className="doc-heading">Introduction</h2>
      <div className="doc-section doc-section--introduction">
        <article className="text ">
          <p>
            This API provides an easy way to integrate with your Postgres database. The API
            documentation below is specifically generated for your database.
          </p>
          <p>
            This is an <b>auto-generating</b> API, so as you make changes to your database, this
            documentation will change too.
          </p>
          <p>
            <b>Note:</b> if you make changes to a field (column) name or type, the API interface for
            those fields will change correspondingly. Therefore, please make sure to update your API
            implementation accordingly whenever you make changes to your Supabase schema from the
            graphical interface.
          </p>

          <div className="not-prose mb-6">
            <p>Read the reference documentation:</p>
            <div className="flex items-center gap-4 mt-2">
              {libs.map((lib) => (
                <a
                  href={lib.url}
                  target="_blank"
                  rel="noreferrer"
                  className="
                  flex items-center gap-1 rounded-md px-3 py-1
                  bg-scale-300 dark:bg-scale-500
                  hover:bg-scale-500 hover:dark:bg-scale-700 transition-colors
                  !text-scale-1100 hover:text-scale-1100
                  "
                >
                  <Image
                    src={`/img/icons/reference-${isDarkTheme ? lib.icon : `${lib.icon}-light`}.svg`}
                    width={16}
                    height={16}
                    alt={lib.name}
                  />
                  {lib.name}
                </a>
              ))}
            </div>
          </div>
        </article>
      </div>

      <h2 className="doc-heading">API URL</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>The API URL for your project.</p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.endpoint(autoApiService.endpoint)}
          />
        </article>
      </div>

      <h2 className="doc-heading">Client Libraries</h2>
      <div className="doc-section doc-section--client-libraries">
        <article className="text">
          <p>Your API consists of both a RESTful interface and a Realtime interface.</p>
          <p>
            For interacting with the Realtime streams, we provide client libraries that handle the
            websockets.
          </p>
        </article>
        <article className="code">
          <CodeSnippet selectedLang={selectedLang} snippet={Snippets.install()} />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.init(autoApiService.endpoint)}
          />
        </article>
      </div>
    </>
  )
}
