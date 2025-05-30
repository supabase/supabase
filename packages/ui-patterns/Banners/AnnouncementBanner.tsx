import { Announcement } from 'ui/src/layout/banners'
import SOSBanner from './SOSBanner'

export const AnnouncementBanner = () => {
  return (
    <Announcement show={true} announcementKey="announcement_sos25">
      <SOSBanner />
    </Announcement>
  )
}
