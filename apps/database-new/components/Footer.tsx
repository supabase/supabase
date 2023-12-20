import Link from 'next/link'
import ThemeSwitcher from './Header/ThemeSwitcher'

export const links = [
  { title: ` © Supabase`, url: 'https://supabase.com/' },
  { title: 'FAQs', url: '/faq' },
  { title: 'Open Source', url: 'https://supabase.com/open-source' },
  { title: 'Privacy Settings', url: 'https://supabase.com/privacy' },
]

const Footer = () => (
  <footer className="border-t py-4 w-full px-4 flex justify-between" role="contentinfo">
    <ul className="flex items-center gap-4 text-xs" role="menu">
      {links.map((link, index) => (
        <li key={index} role="menuitem">
          <Link href={link.url}>{link.title}</Link>
        </li>
      ))}
    </ul>
    <ThemeSwitcher />
  </footer>
)

export default Footer
