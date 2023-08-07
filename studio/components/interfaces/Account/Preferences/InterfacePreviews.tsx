import Panel from 'components/ui/Panel'
import { useLocalStorage } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { Toggle } from 'ui'

const InterfacePreviews = () => {
  const [navigationPreview, setNavigationPreview] = useLocalStorage(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT,
    'false'
  )

  return (
    <Panel title={<h5 key="panel-title">Dashboard feature previews</h5>}>
      <Panel.Content>
        <Toggle
          layout="horizontal"
          checked={navigationPreview === 'true'}
          onChange={() => {
            if (navigationPreview === 'true') setNavigationPreview('false')
            else setNavigationPreview('true')
          }}
          label="Global navigation update"
          descriptionText="Experience a redesigned and improved site navigation on the dashboard, with an intention to making finding your way around more intuitive and easier."
        />
      </Panel.Content>
    </Panel>
  )
}

export default InterfacePreviews
