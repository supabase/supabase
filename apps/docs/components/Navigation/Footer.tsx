import Image from 'next/image'
import Link from 'next/link'
import { Button, IconGitHub, IconTwitter, IconYoutube } from '~/../../packages/ui'
import footerData from '~/data/footer.json'
import { useTheme } from 'common/Providers'

const Footer = () => {
  const { isDarkMode } = useTheme()
  return (
    <div>
      <hr className="border-scale-400  mt-8"></hr>
      <div className="flex gap-4 items-center mt-6 justify-between">
        <div className="flex flex-col lg:flex-row gap-3 ">
          <span className="text-xs text-scale-900">Supabase 2022</span>
          <span className="text-xs text-scale-900">—</span>
          {footerData.map((item) => (
            <Link href={item.url} key={item.url}>
              <a className="text-xs text-scale-800 hover:underline">{item.title}</a>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            as="a"
            // @ts-ignore
            href="https://youtube.com/c/supabase"
            target="_blank"
            rel="noreferrer noopener"
          >
            <IconYoutube size={16} />
          </Button>
          <Button
            type="text"
            as="a"
            // @ts-ignore
            href="https://twitter.com/supabase"
            target="_blank"
            rel="noreferrer noopener"
          >
            <IconTwitter size={16} />
          </Button>
          <Button
            type="text"
            as="a"
            // @ts-ignore
            href="https://discord.supabase.com/"
            target="_blank"
            rel="noreferrer noopener"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16">
              <path
                fill="none"
                fillRule="nonzero"
                stroke={`${isDarkMode ? '#fff' : '#333'}`}
                d="M16.238 2.16a14.628 14.628 0 0 0-3.664-1.159.055.055 0 0 0-.059.028c-.158.288-.333.662-.456.957a13.432 13.432 0 0 0-4.115 0 9.76 9.76 0 0 0-.464-.957.057.057 0 0 0-.058-.028 14.587 14.587 0 0 0-3.664 1.16.053.053 0 0 0-.024.02C1.4 5.74.76 9.21 1.074 12.637c.002.017.011.033.024.043a14.813 14.813 0 0 0 4.494 2.318.058.058 0 0 0 .064-.02c.346-.483.654-.992.92-1.527a.059.059 0 0 0-.032-.08c-.49-.19-.956-.421-1.404-.684a.06.06 0 0 1-.006-.097c.094-.072.189-.148.279-.223a.055.055 0 0 1 .058-.008c2.946 1.372 6.135 1.372 9.046 0a.055.055 0 0 1 .06.007 7.2 7.2 0 0 0 .279.224.06.06 0 0 1-.005.097 9.143 9.143 0 0 1-1.405.683.06.06 0 0 0-.03.081c.27.534.578 1.043.918 1.526.014.02.04.029.063.021A14.763 14.763 0 0 0 18.9 12.68a.06.06 0 0 0 .023-.042c.376-3.962-.628-7.404-2.66-10.455a.046.046 0 0 0-.024-.021Zm-9.223 8.39c-.887 0-1.618-.831-1.618-1.852 0-1.02.717-1.851 1.618-1.851.908 0 1.632.838 1.618 1.851 0 1.02-.717 1.851-1.618 1.851Zm5.981 0c-.887 0-1.618-.831-1.618-1.852 0-1.02.717-1.851 1.618-1.851.908 0 1.632.838 1.618 1.851 0 1.02-.71 1.851-1.618 1.851Z"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Footer
