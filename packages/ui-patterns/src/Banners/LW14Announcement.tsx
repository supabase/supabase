import { Announcement } from 'ui/src/layout/banners'
import LW14Banner from './LW14Banner'

export const LW14Announcement = () => {
  return (
    <Announcement show={true} announcementKey="announcement_lw14_countdown">
      <LW14Banner />
    </Announcement>
  )
}
