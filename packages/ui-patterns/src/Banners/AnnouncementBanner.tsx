import { Announcement } from 'ui/src/layout/banners'
import SelectBanner from './SelectBanner'
import announcementJSON from './data.json'

export const announcement = announcementJSON

export const AnnouncementBanner = () => {
  return (
    <Announcement show={true} announcementKey="announcement_select_25_09">
      <SelectBanner />
    </Announcement>
  )
}
