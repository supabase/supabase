import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'

type Props = {
  title: string
  customer: string
}

const STORAGE_URL =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/og-images'

const CustomerStories = (props: Props) => {
  const { title, customer } = props

  const imageUrl = `https://supabase.com/images/customers/logos/light/${customer}.png`
  const supabaseLogoUrl = `${STORAGE_URL}/customers/supabase-gradient-icon.svg?t=2024-06-01T16%3A09%3A05.507Z`

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        color: '#B4B4B4', // foreground-light
        backgroundColor: '#1C1C1C', // bg-default
        fontFamily: 'Circular',
      }}
    >
      <div tw="flex flex-row items-center justify-center top-0 mb-6">
        <img src={supabaseLogoUrl} width="90px" height="90px" tw="mr-6" />
        <p tw="text-[#FAFAFA] text-[30px] font-light">+</p>
        {customer && (
          <img
            src={imageUrl}
            tw="h-[100px] w-[200px] ml-10 opacity-90"
            style={{
              backgroundRepeat: 'no-repeat',
              objectFit: 'contain',
            }}
          />
        )}
      </div>
      <div tw="w-full top-0 flex flex-col justify-between mt-4">
        <div tw="flex flex-col w-full">
          <hr tw="border-b border-[#4D4D4D] w-full relative flex mb-10" />
          <h1 tw="w-3/4 my-0 mb-2 text-[53px]">{!title ? 'Supabase' : title}</h1>
        </div>
      </div>
    </div>
  )
}

export default CustomerStories
