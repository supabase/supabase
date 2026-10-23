import { DitheredSkeletonGif } from '../../DitheredSkeleton/DitheredSkeletonGif'

// Experimental: renders the GIF-masked dithered skeleton with its compositor-driven shine.
function Skeleton(props: React.HTMLAttributes<HTMLDivElement>) {
  return <DitheredSkeletonGif data-slot="skeleton" {...props} />
}

export { Skeleton }
