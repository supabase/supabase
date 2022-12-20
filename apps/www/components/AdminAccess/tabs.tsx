import TabMarkup from 'data/AdminAccess.json'
import { Tabs as SBTabs, Button } from 'ui'

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
    <div className="-mt-20 flex w-full justify-between sm:relative lg:mt-0">
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
                <h3>{TabMarkup['tabTableEditor'].header}</h3>
                <dd className="mt-8">
                  <p>{TabMarkup['tabTableEditor'].description}</p>
                </dd>
              </div>
              <a href={TabMarkup['tabTableEditor'].url}>
                <Button className="mt-8">{TabMarkup['tabTableEditor'].cta}</Button>
              </a>
            </SBTabs.Panel>

            <SBTabs.Panel id="tabSqlEditor" label=" SQL Editor">
              <div className="mt-5">
                <h3>{TabMarkup['tabSqlEditor'].header}</h3>
                <dd className="mt-8">
                  <p>{TabMarkup['tabSqlEditor'].description}</p>
                </dd>
              </div>
              <a href={TabMarkup['tabSqlEditor'].url}>
                <Button className="mt-8">{TabMarkup['tabSqlEditor'].cta}</Button>
              </a>
            </SBTabs.Panel>
            <SBTabs.Panel id="tabAuthRules" label="Auth Rules">
              <div className="mt-5">
                <h3>{TabMarkup['tabAuthRules'].header}</h3>
                <dd className="mt-8">
                  <p>{TabMarkup['tabAuthRules'].description}</p>
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
