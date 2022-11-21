import React, { useEffect, useState } from 'react'
import mermaid from 'mermaid'

const theme = `
.node rect { fill: rgba(62,207,142, 0.3); stroke: #24b47e; }
.cluster rect { fill: var(--custom-background-color-highlight); stroke: #999; }
.edgePath path { fill: var(--custom-primary) }
.edgePath .path { stroke: var(--custom-primary) }

g.classGroup rect { fill: rgba(62,207,142, 0.3); stroke: #24b47e; }
g.classGroup line { stroke: var(--custom-primary); }
g.classGroup text { fill: var(--ifm-color-content); color: var(--ifm-color-content); }
.classLabel .label { fill: var(--ifm-color-content); color: var(--ifm-color-content); }
classGroup .title { fill: var(--ifm-color-content); color: var(--ifm-color-content); }
composition {  stroke: var(--custom-primary); }
aggregation { stroke: var(--custom-primary); }
dependency { stroke: var(--custom-primary); }
.relation { stroke: var(--custom-primary); }
`

mermaid.initialize({ themeCSS: theme })

export default function Mermaid({ graph, classNames, caption }) {
  let [rendered, setRendered] = useState(<div></div>)

  useEffect(() => {
    mermaid.render('mermaid-ID', graph.toString(), (html) => setRendered(html))
  }, [graph])

  return (
    <div className={`Mermaid ${classNames || ''}`}>
      {caption && <figcaption>{caption}</figcaption>}
      <div
        className="graph"
        dangerouslySetInnerHTML={{ __html: rendered }}
      ></div>
    </div>
  )
}
