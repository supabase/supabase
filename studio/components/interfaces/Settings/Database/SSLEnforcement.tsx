import { useParams } from 'hooks'
import { useSSLEnforcementQuery } from 'data/ssl-enforcement/ssl-enforcement-query'

const SSLEnforcement = () => {
  const { ref } = useParams()
  const { data, isLoading } = useSSLEnforcementQuery({ projectRef: ref })

  console.log({ data })

  return <div>SSL enforcement</div>
}

export default SSLEnforcement
