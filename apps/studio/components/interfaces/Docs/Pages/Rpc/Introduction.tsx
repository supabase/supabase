import { DocSection } from '../../DocSection'

const Introduction = () => {
  return (
    <DocSection
      title="Introduction"
      content={
        <>
          <p>
            All of your database stored procedures are available on your API. This means you can
            build your logic directly into the database (if you're brave enough)!
          </p>
          <p>The API endpoint supports POST (and in some cases GET) to execute the function.</p>
        </>
      }
    />
  )
}

export default Introduction
