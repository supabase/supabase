import { Menu } from '@supabase/ui'
import styles from '../../styles/Home.module.css'
import ThemeToggle from '../ThemeToggle'

const SideBar = () => {
  return (
    <div className={`${styles.sidebar} fixed relative h-full`}>
      <Menu className={`border-r dark:border-gray-600`}>
        <div>
          <Menu.Group title="Overview" />
          <Menu.Item active showActiveBar>
            Introduction
          </Menu.Item>
          <Menu.Item>Architecture</Menu.Item>
          <Menu.Item>Database</Menu.Item>
          <Menu.Item>Auth</Menu.Item>
          <Menu.Item>Storage</Menu.Item>
          <Menu.Item>APIs</Menu.Item>
          <Menu.Item>Examples and Resources</Menu.Item>
          <Menu.Group title="Tutorials" />
          <Menu.Item>Quickstart: Angular</Menu.Item>
          <Menu.Item>Quickstart: Flutter</Menu.Item>
          <Menu.Item>Quickstart: Next.js</Menu.Item>
          <Menu.Item>Quickstart: React</Menu.Item>
          <Menu.Item>Quickstart: RedwoodJS</Menu.Item>
          <Menu.Item>Quickstart: Svelte</Menu.Item>
          <Menu.Item>Quickstart: Vue 3</Menu.Item>
          <Menu.Group title="Tutorials" />
          <Menu.Item>FAQs</Menu.Item>
          <Menu.Item>Going into Prod Checklist</Menu.Item>
          <Menu.Item>Contributing</Menu.Item>
          <Menu.Item>SupaSquad</Menu.Item>
          <Menu.Item>Terms of Service</Menu.Item>
          <Menu.Item>Privacy Policy</Menu.Item>
          <Menu.Item>Acceptable Use Policy</Menu.Item>
        </div>
        <div className="mt-16 w-full">
          <Menu.Item>
            <ThemeToggle />
          </Menu.Item>
        </div>
      </Menu>
    </div>
  )
}

export default SideBar
