import Link from 'next/link'
import Image from 'next/image'

const Nav = () => {
  return (
    <div className="flex p-4">
      <div className=''>
        <Link href="/">
          <img src="/supabase-logo-wordmark--dark.svg" width="100" />
        </Link>
      </div>
      <div>
        <Link href="/about">
          <a>About</a>
        </Link>
        <Link href="/careers">
          <a>Careers</a>
        </Link>
      </div>
    </div>
  )
}

export default Nav