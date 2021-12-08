import Image from 'next/image'
export default function Sponsor({ imageUrl, handle }: { imageUrl: string; handle: string }) {
  return (
    <div className="flex flex-row h-14 w-44 items-center my-4">
      <img
        src={`https://github.com/${handle}.png`}
        className="w-10 rounded-full mr-2"
        alt={handle}
      />
      <h5>{handle}</h5>
    </div>
  )
}
