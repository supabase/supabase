import { allDocs } from 'contentlayer/generated'

function Navigation() {
  return (
    <nav>
      {allDocs.map((doc) => (
        <div key={doc.slug}>
          <a href={`${doc.slug}`}>{doc.title}</a>
        </div>
      ))}
    </nav>
  )
}

export default Navigation
