import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

export const QueryPerformanceLoadingRow = ({ colSpan }: { colSpan: number }) => {
  return (
    <>
      {Array(4)
        .fill('')
        .map((_, i) => (
          <tr key={'loading-' + { i }}>
            <td colSpan={colSpan}>
              <ShimmeringLoader />
            </td>
          </tr>
        ))}
    </>
  )
}
