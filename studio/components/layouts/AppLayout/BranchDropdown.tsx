import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'

const BranchDropdown = () => {
  const { ref: projectRef } = useParams()
  const { data } = useBranchesQuery({ projectRef })
  console.log(data)

  return <div>Branch</div>
}

export default BranchDropdown
