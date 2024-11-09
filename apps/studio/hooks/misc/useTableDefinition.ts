import { useViewDefinitionQuery } from '../../data/database/view-definition-query'
import { useTableDefinitionQuery } from '../../data/database/table-definition-query'
import { format } from 'sql-formatter'
import { Project } from 'data/projects/project-detail-query'
import { ENTITY_TYPE } from '../../data/entity-types/entity-type-constants'
import { Entity } from '../../data/entity-types/entity-types-infinite-query'

function useTableDefinition(entity: Entity, project: Project | undefined) {
  const viewResult = useViewDefinitionQuery(
    {
      schema: entity?.schema,
      name: entity?.name,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: entity?.type === ENTITY_TYPE.VIEW || entity?.type === ENTITY_TYPE.MATERIALIZED_VIEW,
    }
  )

  const tableResult = useTableDefinitionQuery(
    {
      schema: entity?.schema,
      name: entity?.name,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: entity?.type === ENTITY_TYPE.TABLE,
    }
  )

  const { data: definition, isLoading } =
    entity?.type === ENTITY_TYPE.VIEW || entity?.type === ENTITY_TYPE.MATERIALIZED_VIEW
      ? viewResult
      : tableResult

  const prepend =
    entity?.type === ENTITY_TYPE.VIEW
      ? `create view ${entity.schema}.${entity.name} as\n`
      : entity?.type === ENTITY_TYPE.MATERIALIZED_VIEW
        ? `create materialized view ${entity.schema}.${entity.name} as\n`
        : ''

  const formatDefinition = (value: string) => {
    try {
      return format(value, {
        language: 'postgresql',
        keywordCase: 'lower',
      })
    } catch (err) {
      return value
    }
  }

  const formattedDefinition = formatDefinition(prepend + definition)

  return { formattedDefinition, isLoading }
}

export default useTableDefinition