import { DitheredSkeletonGif } from '../../DitheredSkeleton/DitheredSkeletonGif'

// Experimental: renders the GIF-masked dithered skeleton without the shine, so the only motion is
// the GIF itself and loading states cost no JavaScript or main-thread work per frame.
function Skeleton(props: React.HTMLAttributes<HTMLDivElement>) {
  return <DitheredSkeletonGif data-slot="skeleton" shine={false} {...props} />
}

export { Skeleton }
