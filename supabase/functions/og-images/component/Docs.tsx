import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'

type Props = {
  type?: string | null
  title: string
  description: string
  icon?: string | null
}

const Docs = (props: Props) => {
  const { type, title, description, icon } = props

  let typeName: string | undefined = type
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
  let typeIcon: string | undefined = type?.toLowerCase()

  if (type === 'functions' || type === 'function') {
    typeName = 'Edge Functions'
  } else if (type === 'self-hosting') {
    typeIcon = 'resources'
  } else if (type === 'cli') {
    typeName = 'CLI'
    typeIcon = 'reference-cli'
  } else if (type === 'ai') {
    typeName = 'AI & Vectors'
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        color: '#EDEDED',
        backgroundColor: '#181818',
        fontFamily: 'Circular',
      }}
    >
      <div tw="w-full flex flex-row items-center justify-between">
        <div tw="flex flex-row items-center" style={{ lineHeight: '100%' }}>
          {icon && (
            <img
              src={`https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/public/img/icons/${icon}-icon.svg`}
              width="50px"
              height="50px"
            />
          )}
          {type && icon && <div tw="h-[50px] border-[1px] border-white mx-4"></div>}
          {type && (
            <>
              <img
                src={`https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/public/img/icons/menu/grayscale/${typeIcon}.svg`}
                width="40px"
                height="40px"
              />
              <span tw="text-[36px] text-[#ededed] ml-4 -mt-[2px]">{typeName}</span>
            </>
          )}
        </div>
        <div tw="flex flex-row items-center justify-center">
          <img
            src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg"
            width={180}
            height={34}
          />
          <span tw="text-2xl font-normal text-[#3ecf8e] ml-4" style={{ fontFamily: 'SourceCode' }}>
            DOCS
          </span>
        </div>
      </div>
      <div tw="w-full flex flex-col border-t border-[#4D4D4D] mt-10">
        <div tw="w-full flex flex-col mt-5">
          <h1 tw="my-0 mb-2 text-[60px]" style={{ lineHeight: '115%' }}>
            {!title ? 'Supabase' : title}
          </h1>
          <p tw="my-0 mt-2 text-[40px] text-[#f2fff9] opacity-50">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default Docs
