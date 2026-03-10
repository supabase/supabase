import { ShimmeringLoader } from 'ui-patterns'

export const DocViewLoading = () => {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col py-10 space-y-2">
      <ShimmeringLoader className="h-2 w-24 max-w-full" />
      <ShimmeringLoader className="h-2 w-96 max-w-full" />
      <ShimmeringLoader className="h-2 w-96 max-w-full" />
      <ShimmeringLoader className="h-2 w-96 max-w-full" />
    </div>
  )
}
