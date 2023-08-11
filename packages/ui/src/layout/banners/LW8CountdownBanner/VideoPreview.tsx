import Image from 'next/image'

const VideoPreview = () => (
  <div className="relative h-8 !aspect-video flex items-center justify-center rounded overflow-hidden border transition-colors">
    <div className="absolute z-10 w-2.5 h-2.5 text-white opacity-100">
      <svg viewBox="0 0 81 91" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M76.5621 37.998C82.3369 41.3321 82.3369 49.6673 76.5621 53.0014L13.2198 89.5721C7.44504 92.9062 0.226562 88.7386 0.226562 82.0704L0.226566 8.92901C0.226566 2.26085 7.44506 -1.90673 13.2199 1.42735L76.5621 37.998Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <Image
      src="https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw8/assets/yt_d5.jpg?t=2023-08-11T09%3A31%3A39.412Z"
      alt="Video thumbnail"
      layout="fill"
      objectFit="cover"
    />
  </div>
)

export default VideoPreview
