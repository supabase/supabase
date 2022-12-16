import Image from 'next/image'
import Link from 'next/link'
import { Button, IconGitHub, IconTwitter } from '~/../../packages/ui'
import footerData from '~/data/footer.json'

const Footer = () => {
  return (
    <div>
      <hr className="border-scale-400  mt-8"></hr>
      <div className="flex gap-4 items-center mt-6 justify-between">
        <div className="flex flex-col lg:flex-row gap-3 ">
          <span className="text-xs text-scale-900">Supabase 2022</span>
          <span className="text-xs text-scale-900">—</span>
          {footerData.map((item) => (
            <Link href={item.url}>
              <a className="text-xs text-scale-800 hover:underline">{item.title}</a>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
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
            <Image
              alt="Discord"
              width={16}
              height={13}
              src="/docs/img/icons/discord-icon-outline.svg"
            />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Footer
