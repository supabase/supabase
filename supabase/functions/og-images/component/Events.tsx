import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'

type Props = {
  date: string
  description: string
  duration?: string
  eventType: string
  title: string
}

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public'

const CustomerStories = (props: Props) => {
  const { title, description, duration, eventType, date } = props

  const bgImageUrl = `${STORAGE_URL}/images/og-images/events/events-og-bg.png`
  const supabaseLogoUrl = `${STORAGE_URL}/supabase-brand-assets/logos/supabase-logo-wordmark--dark.png`

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        color: '#EDEDED', // foreground-default
        backgroundColor: '#1C1C1C', // bg-default
        fontFamily: 'Circular',
      }}
    >
      <img
        src={bgImageUrl}
        width="1200px"
        height="630px"
        tw="w-[1200px] h-[630px] absolute object-cover"
      />
      <div tw="flex flex-row items-center justify-center top-0 mb-20">
        <img src={supabaseLogoUrl} width="165px" height="31.73px" tw="mr-6" />
      </div>
      <div tw="flex flex-row items-center justify-center text-[24px] text-[#B4B4B4]">
        <span tw="text-[#3ECF8E] uppercase" style={{ fontFamily: 'SourceCode' }}>
          {eventType}
        </span>
        <span tw="h-[21px] w-px bg-[#292929] mx-5"></span>
        <span tw="mb-1">{date}</span>
        {duration && (
          <>
            <span tw="h-[21px] mt-2 w-px bg-[#292929] mx-5"></span>
            <span tw="mb-1">Duration: {duration}</span>
          </>
        )}
      </div>
      <div tw="w-full top-0 flex flex-col justify-between mt-4">
        <div tw="flex flex-col w-full">
          <h1 tw="w-3/4 mt-0 mb-2 text-[60px] tracking-tight leading-[105%]">{title}</h1>
          <p tw="w-3/4 my-0 mt-4 text-[32px] text-[#B4B4B4]">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default CustomerStories
