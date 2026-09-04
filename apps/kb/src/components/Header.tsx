import { Logo } from './Logo'
import { Nav } from './Nav'
import { ThemeToggle } from './ThemeToggle'

// Bare-bones port of apps/docs' TopNavBar — logo, nav, and theme toggle, each
// split into their own component (Logo.tsx, Nav.tsx, ThemeToggle.tsx). No
// search, no user menu, no dashboard link — kb doesn't have any of that yet.
function Header() {
  return (
    <header className="backdrop-blur-sm backdrop-filter bg-default/75 border-b w-full px-5 lg:pl-10 items-center flex h-(--header-height) gap-3">
      <div className="flex basis-full h-full items-center justify-center gap-2">
        <Logo />
        <Nav />
      </div>
      <ThemeToggle />
    </header>
  )
}

export { Header }
