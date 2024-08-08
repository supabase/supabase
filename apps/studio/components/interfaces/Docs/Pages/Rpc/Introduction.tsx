const Introduction = () => {
  return (
    <>
      <h2 className="doc-heading">Introduction</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            All of your database stored procedures are available on your API. This means you can
            build your logic directly into the database (if you're brave enough)!
          </p>
          <p>The API endpoint supports POST (and in some cases GET) to execute the function.</p>
        </article>
      </div>
    </>
  )
}

export default Introduction
