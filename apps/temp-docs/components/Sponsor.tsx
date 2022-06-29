import Image from 'next/image'
export default function Sponsor({ imageUrl, handle }: { imageUrl: string; handle: string }) {
  return (
    <div className="my-4 flex h-14 w-44 flex-row items-center">
      <Image
        className="mr-2 rounded-full"
        src={`https://github.com/${handle}.png`}
        alt={handle}
        width={32}
        height={32}
      />
      <h5>{handle}</h5>
    </div>
  )
}
