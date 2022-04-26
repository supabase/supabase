import Image from 'next/image'
export default function Sponsor({ imageUrl, handle }: { imageUrl: string; handle: string }) {
  return (
    <div className="my-4 flex h-14 w-44 flex-row items-center">
      <img
        src={`https://github.com/${handle}.png`}
        className="mr-2 w-10 rounded-full"
        alt={handle}
      />
      <h5>{handle}</h5>
    </div>
  )
}
