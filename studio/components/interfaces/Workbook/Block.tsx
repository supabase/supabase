import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useExecuteQueryMutation } from 'data/sql/execute-query-mutation'
import { useState } from 'react'

type Block = {
  id: string
  body: string
}

type WorkbookBlockProps = {
  block: Block
}

const WorkbookBlock = ({ block }: WorkbookBlockProps) => {
  const [value, setValue] = useState(block.body)

  const { mutate, data } = useExecuteQueryMutation()
  const { project } = useProjectContext()

  const onRun = () => {
    mutate({
      sql: value,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
  }

  return (
    <div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={onRun}>Run</button>

      {data && (
        <pre>
          <code>{JSON.stringify(data.result, null, 2)}</code>
        </pre>
      )}
    </div>
  )
}

export default WorkbookBlock
