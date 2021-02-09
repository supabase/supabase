import TabMarkup from 'data/AdminAccess.json'
import { Tabs as SBTabs, Typography, Button } from '@supabase/ui'

type Props = {
  tabId: string
  setTabId: Function
}

function Tabs(props: Props) {
  const { tabId, setTabId } = props

  function handleTabChange(id: string) {
    return setTabId(id)
  }

  return (
    <div className="flex justify-between w-full sm:relative -mt-20 lg:mt-0">
      <div>
        <div className="">
          <SBTabs
            onClick={(id: string) => handleTabChange(id)}
            activeId={tabId}
            type="underlined"
            size="large"
            block
          >
            <SBTabs.Panel id="tabTableEditor" label="Table Editor">
              <div className="mt-5">
                <Typography.Title level={3}>{TabMarkup['tabTableEditor'].header}</Typography.Title>
                <dd className="mt-8">
                  <Typography.Text>{TabMarkup['tabTableEditor'].description}</Typography.Text>
                </dd>
              </div>
              <a href={TabMarkup['tabTableEditor'].url}>
                <Button className="mt-8">{TabMarkup['tabTableEditor'].cta}</Button>
              </a>
            </SBTabs.Panel>

            <SBTabs.Panel id="tabSqlEditor" label=" SQL Editor">
              <div className="mt-5">
                <Typography.Title level={3}>{TabMarkup['tabSqlEditor'].header}</Typography.Title>
                <dd className="mt-8">
                  <Typography.Text>{TabMarkup['tabSqlEditor'].description}</Typography.Text>
                </dd>
              </div>
              <a href={TabMarkup['tabSqlEditor'].url}>
                <Button className="mt-8">{TabMarkup['tabSqlEditor'].cta}</Button>
              </a>
            </SBTabs.Panel>
            <SBTabs.Panel id="tabAuthRules" label="Auth Rules">
              <div className="mt-5">
                <Typography.Title level={3}>{TabMarkup['tabAuthRules'].header}</Typography.Title>
                <dd className="mt-8">
                  <Typography.Text>{TabMarkup['tabAuthRules'].description}</Typography.Text>
                </dd>
              </div>
              <a href={TabMarkup['tabAuthRules'].url}>
                <Button className="mt-8">{TabMarkup['tabAuthRules'].cta}</Button>
              </a>
            </SBTabs.Panel>
          </SBTabs>
        </div>
      </div>
    </div>
  )
}

export default Tabs
