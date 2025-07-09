import { Announcement } from 'ui/src/layout/banners'
import LW15Banner from './LW15Banner'

export const AnnouncementBanner = () => {
  return (
    <Announcement show={true} announcementKey="announcement_sos25">
      <LW15Banner />
    </Announcement>
  )
}
