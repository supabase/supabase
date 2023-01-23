import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'

type Props = {
    type?: string | null
    title: string
    description: string
    icon?: string | null
}

const Docs = (props: Props) => {
    const { type, title, description, icon } = props
    
    return (
        <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          color: 'white',
          backgroundColor: '#1c1c1c',
          fontFamily: 'Circular',
          backgroundImage: 'url(https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/og-images/gradient.svg)',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div tw="flex flex-row items-center justify-center absolute top-[60px] left-[64px]">
          {icon && (
            <img src={`https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/public/img/icons/${icon}-icon.svg`} width="50px" height="50px" />
          )}
          {type && icon && (
            <div tw="h-[50px] border-[1px] border-white mx-4"></div>
          )}
          {type && (
            <>
                <div tw="w-[50px] h-[50px] bg-[#164430] rounded-md flex items-center justify-center">
                    <img src={`https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/public/img/icons/menu/${type.toLowerCase()}.svg`} width="80%" height="80%" />
                </div>
                <span tw="text-[36px] text-[#ededed] ml-[16px]">{type}</span>
            </>
          )}
        </div>
        <div tw="flex flex-col">
          <div tw="flex flex-col absolute left-[64px] top-[154px] w-[1072px]">
            <h1 tw="my-0 mb-2 text-[60px]">{!title ? 'Supabase' : title.substring(0, 1).toUpperCase() + title.substring(1)}</h1>
            <p tw="my-0 mt-2 text-[40px] text-[#f2fff9] opacity-50">{description}</p>
          </div>
          <div tw="flex flex-row items-center justify-center absolute left-[64px] top-[500px]">
            <img src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.png" width={180} height={34} />
            <span tw="text-lg font-normal text-[#3ecf8e] ml-2">DOCS</span>
          </div>
        </div>
      </div>
    )
}

export default Docs
