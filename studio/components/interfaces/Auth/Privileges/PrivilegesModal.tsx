import { FC } from 'react'
import { Modal } from 'ui'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { PrivilegesData, PrivilegesDataResponse } from 'data/database/privileges-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { sqlKeys } from 'data/sql/keys'
import { generatePrivilegesSQLQuery } from './Privileges.utils'
import PrivilegesReview from './PrivilegesReview'

interface Props {
  visible: boolean
  original: PrivilegesData
  changes: PrivilegesData
  onCancel: () => void
  onSuccess: () => void
}

const PrivilegesModal: FC<Props> = (props) => {
  const sqlStatement = generatePrivilegesSQLQuery(props.original, props.changes)

  const queryClient = useQueryClient()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { mutate, isLoading } = useExecuteSqlMutation({
    onMutate: async () => {
      const queryKey = sqlKeys.query(ref, ['privileges'])
      await queryClient.cancelQueries(queryKey)

      const previous = queryClient.getQueryData<PrivilegesData>(queryKey)

      if (previous) {
        queryClient.setQueryData<PrivilegesDataResponse>(queryKey, {
          result: [{ result_json: props.changes }],
        })
      }

      return { previous }
    },
  })

  const handleSave = () =>
    mutate(
      {
        sql: sqlStatement,
        projectRef: ref,
        connectionString: project?.connectionString,
      },
      {
        onSuccess: () => props.onSuccess(),
      }
    )

  return (
    <Modal
      size="xxlarge"
      closable
      hideFooter
      visible={props.visible}
      contentStyle={{ padding: 0 }}
      header={
        <div className="flex items-center space-x-3">
          <h4 className="m-0 truncate text-lg">Reviewing privileges changes</h4>
        </div>
      }
      onCancel={props.onCancel}
    >
      <PrivilegesReview
        sqlStatement={sqlStatement}
        isSaving={isLoading}
        onSelectBack={props.onCancel}
        onSelectSave={handleSave}
      />
    </Modal>
  )
}

export default PrivilegesModal
