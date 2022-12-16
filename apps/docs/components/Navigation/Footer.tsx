import Link from 'next/link'

const Footer = () => {
  return (
    <div>
      <hr className="border-scale-400  mt-8"></hr>
      <div className="flex flex-col lg:flex-row gap-3 mt-6">
        <span className="text-xs text-scale-900">Supabase 2022</span>
        <span className="text-xs text-scale-900">—</span>
        <Link href="/handbook/contributing">
          <a className="text-xs text-scale-800 hover:underline">Contributing</a>
        </Link>
        <Link href="https://supabase.com/changelog">
          <a className="text-xs text-scale-800 hover:underline">Changelog</a>
        </Link>

        <Link href="https://github.com/supabase/supabase/blob/master/DEVELOPERS.md">
          <a className="text-xs text-scale-800 hover:underline">Author Styleguide</a>
        </Link>
        <Link href="https://supabase.com/docs/oss">
          <a className="text-xs text-scale-800 hover:underline">Open Source</a>
        </Link>
        <Link href="https://supabase.com/supasquad">
          <a className="text-xs text-scale-800 hover:underline">SupaSquad</a>
        </Link>
      </div>
    </div>
  )
}

export default Footer
