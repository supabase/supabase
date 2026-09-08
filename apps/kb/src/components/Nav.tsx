import {
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from 'ui'

/**
 * Hard-codding links in here for now until we have actual content. Might be worth putting these arrays in their on data file too.
 */
const topics = [
  { label: 'Troubleshooting', href: '#' },
  { label: 'Migrations', href: '#' },
  { label: 'Comparisons', href: '#' },
]

const resources = [
  { label: 'Status', href: 'https://status.supabase.com' },
  { label: 'Changelog', href: 'https://supabase.com/changelog' },
  { label: 'Docs', href: 'https://supabase.com/docs' },
]

const menus = [
  { label: 'Topics', items: topics },
  { label: 'Resources', items: resources },
]

const triggerClass =
  'h-(--header-height) p-2 bg-transparent border-transparent font-normal rounded-none text-foreground-light hover:text-foreground data-open:text-foreground! border-0 focus-ring focus-visible:text-foreground h-full focus-visible:rounded-sm shadow-none!'
// docs gates this at `md:absolute` (its own base component class) because its
// nav is hidden entirely below `lg` in favor of a separate mobile menu. kb
// doesn't have that split — the nav is always visible — so `absolute` is
// unconditional here; without it, an open menu pushes its siblings around
// below the `md` breakpoint instead of overlaying them.
const contentClass =
  'absolute top-[calc(100%+4px)]! min-w-56 max-h-[calc(100vh-4rem)] border-y w-screen md:w-64 overflow-hidden overflow-y-auto rounded-none md:rounded-md md:border border-overlay bg-overlay text-foreground-light shadow-md duration-0!'
const itemClass =
  'w-full flex h-8 items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline focus-ring focus-visible:text-foreground'

function Nav() {
  return (
    <div className="flex relative gap-2 justify-start items-end w-full h-full">
      <NavigationMenu
        delayDuration={0}
        skipDelayDuration={0}
        className="w-full flex justify-start h-full"
        renderViewport={false}
      >
        <NavigationMenuList className="px-6 space-x-2 h-(--header-height)">
          {menus.map((menu) => (
            <NavigationMenuItem key={menu.label} className="text-sm relative h-full m-0">
              <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), triggerClass)}>
                {menu.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className={contentClass}>
                <div className="p-3 md:p-1">
                  {menu.items.map((item) => (
                    <NavigationMenuLink key={item.label} asChild>
                      <a href={item.href} className={itemClass}>
                        {item.label}
                      </a>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

export { Nav }
