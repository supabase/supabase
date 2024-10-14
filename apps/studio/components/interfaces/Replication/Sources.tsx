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
    
        <ProductEmptyState
          title="Replication"
          ctaButtonLabel={'Enable replication'}
        >
          <p className="text-sm text-foreground-light">
            Replication is not enabled for this project.
          </p>
        </ProductEmptyState>
    : <div>Some sources</div>}
    </div>)
}