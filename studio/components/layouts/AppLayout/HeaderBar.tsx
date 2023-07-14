import Link from 'next/link'
import { useRouter } from 'next/router'
import FeedbackDropdown from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import { Button, Dropdown, IconHelpCircle, IconInbox } from 'ui'
import { useProfile } from 'lib/profile'
import OrganizationDropdown from './OrganizationDropdown'

const HeaderBar = () => {
  const router = useRouter()
  const { profile } = useProfile()

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-scale-100 shadow-md">
      {/* Organization + Project */}
      <div className="flex items-center space-x-4">
        <Link href="/projects-v2">
          <a className="block">
            <img
              src={`${router.basePath}/img/supabase-logo.svg`}
              alt="Supabase"
              className="mx-auto h-[40px] w-6 cursor-pointer rounded"
            />
          </a>
        </Link>
        <OrganizationDropdown />
      </div>

      {/* Account, Settings, etc */}
      <div className="flex items-center space-x-4">
        <FeedbackDropdown />
        <Button type="text" className="px-1" icon={<IconInbox size={18} />} />
        <Button type="text" className="px-1" icon={<IconHelpCircle size={18} />} />
        <Dropdown
          align="end"
          side="bottom"
          overlay={[<Dropdown.Item key="test">Hello</Dropdown.Item>]}
        >
          <div className="flex items-center justify-center border rounded-full h-7 w-7 text-scale-1100">
            {profile?.first_name[0]}
          </div>
        </Dropdown>
      </div>
    </div>
  )
}

export default HeaderBar
