import Snippets from '../Snippets'
import CodeSnippet from '../CodeSnippet'

export default function Introduction({ autoApiService, selectedLang }) {
  return (
    <>
      <h2 className="doc-heading">Introduction</h2>
      <div className="doc-section">
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
            <b>Please note:</b> if you make changes to a field (column) name or type, the API
            interface for those fields will change correspondingly. Therefore, please make sure to
            update your API implementation accordingly whenever you make changes to your Supabase
            schema from the graphical interface.
          </p>
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
      <div className="doc-section">
        <article className="text ">
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
