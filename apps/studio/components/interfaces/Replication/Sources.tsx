import { useProjectContext } from "components/layouts/ProjectLayout/ProjectContext"
import ProductEmptyState from "components/to-be-cleaned/ProductEmptyState"
import { useReplicationSourcesQuery } from "data/replication/sources-query"

export const ReplicationSources = () => {
    
  const { project } = useProjectContext()
  const { data } = useReplicationSourcesQuery({
    projectRef: project?.ref,
  })

  const totalCount = data?.length

  return (<div className="w-full h-full flex items-center justify-center">
    {totalCount === 0 ? 
    
      <div>No Sources</div>
    : <div>Some sources</div>}
    </div>)
}