import { Button, Layouts } from 'ui'
import Sidebar from '../components/Sidebar'

export default function Docs() {
  return (
    <Layouts.SidebarLayout sidebarContent={<Sidebar />}>
      <>
        <h1>Docs</h1>
        <Button />
      </>
    </Layouts.SidebarLayout>
  )
}
