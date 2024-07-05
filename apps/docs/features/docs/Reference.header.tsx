import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'

interface ClientLibHeaderProps {
  menuData: { title: string; icon?: string }
}

function ClientLibHeader({ menuData }: ClientLibHeaderProps) {
  return (
    <>
      {'icon' in menuData && <MenuIconPicker icon={menuData.icon} />}
      <h1>{menuData.title} Client Library</h1>
    </>
  )
}

export { ClientLibHeader }
