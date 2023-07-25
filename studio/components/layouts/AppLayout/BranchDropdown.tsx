import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchesQuery } from 'data/branches/branches-query'

const BranchDropdown = () => {
  const { ref: projectRef } = useParams()
  const { data: branches, isLoading, isError, isSuccess } = useBranchesQuery({ projectRef })
  console.log({ branches })

  return (
    <>
      {isLoading && <ShimmeringLoader className="w-[90px]" />}
      {isError && <div></div>}
      {isSuccess && <div></div>}
    </>
  )
}

export default BranchDropdown
