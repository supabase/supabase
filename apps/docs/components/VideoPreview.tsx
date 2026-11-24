import Image from 'next/image'
import { EXPANDABLE_VIDEO_THUMBNAIL_SIZES } from 'ui-patterns/ExpandableVideo'
import { GlassLens } from 'ui-patterns/GlassLens'

interface VideoPreviewProps {
  imgUrl: string
}

const VideoPreview = ({ imgUrl }: VideoPreviewProps) => (
  <span
    className="
      group relative block aspect-video cursor-pointer overflow-hidden rounded-lg
      bg-[radial-gradient(120%_100%_at_50%_0%,#fafaf9,#ececea_70%)]
      shadow-[0_0_0_1px_rgb(0_0_0/0.1)]
      dark:bg-[radial-gradient(120%_100%_at_50%_0%,#1a1a17,#0b0b0a_70%)]
      dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]
    "
  >
    <GlassLens shimmer={10} className="absolute inset-0 scale-105 opacity-75">
      <Image
        src={imgUrl}
        alt=""
        fill
        sizes={EXPANDABLE_VIDEO_THUMBNAIL_SIZES}
        className="object-cover"
      />
    </GlassLens>
    <span aria-hidden className="crt-scanlines absolute inset-0" />
    <span
      aria-hidden
      className="
        absolute inset-0 rounded-lg
        dark:shadow-[inset_0_0_0_1px_#000,inset_0_1px_8px_rgb(0_0_0/0.9),inset_0_0_32px_rgb(0_0_0/0.6)]
      "
    />
    <span className="absolute inset-0 flex items-center justify-center">
      <span
        className="
          grid size-8 place-items-center rounded-full bg-white/60 text-black backdrop-blur-md
          transition-colors group-hover:bg-white in-focus-visible:bg-white
        "
      >
        <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
          <path d="m5.604 2.41 7.23 4.502a1.375 1.375 0 0 1-.02 2.345L5.585 13.6a1.375 1.375 0 0 1-2.083-1.18V3.576A1.375 1.375 0 0 1 5.604 2.41Z" />
        </svg>
      </span>
      <span className="sr-only">Play video</span>
    </span>
  </span>
)

export { VideoPreview }
