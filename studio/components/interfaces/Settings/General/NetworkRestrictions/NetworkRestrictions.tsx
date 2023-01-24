import { FormHeader } from 'components/ui/Forms'

import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
import { useParams } from 'hooks'

const NetworkRestrictions = ({}) => {
  const { ref } = useParams()
  const { data, isLoading, isError, isSuccess } = useNetworkRestrictionsQuery({ projectRef: ref })

  console.log(data)

  return (
    <section>
      <FormHeader
        title="Network Restrictions"
        description="Control access to your database via IP addresses"
      />
    </section>
  )
}

export default NetworkRestrictions
