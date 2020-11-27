import TabMarkup from "./../data/AdminAccess.json"

type Props = { 
  tabId: string,
  setTabId: Function,
}

function Tabs(props: Props) {
  const { tabId, setTabId } = props

  function handleTabChange(event: any) {
    //@ts-ignore
    event.preventDefault()
    const tabId: string = event.target.id
    return setTabId(tabId)
  }

  return (
    <div className="flex justify-between items-center w-full">
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <a
              href="#"
              id="tabTableEditor"
              className={"w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm" + (tabId === "tabTableEditor" ? " border-brand-500 text-brand-600" : " border-b border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")}
              onClick={(event: any) => handleTabChange(event)}
            >
              Table Editor
            </a>
            <a
              href="#"
              id="tabSqlEditor"
              className={"w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm" + (tabId === "tabSqlEditor" ? " border-brand-500 text-brand-600" : " border-b border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")}
              onClick={(event: any) => handleTabChange(event)}
            >
              SQL Editor
            </a>
            <a
              href="#"
              id="tabAuthRules"
              className={"w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm" + (tabId === "tabAuthRules" ? " border-brand-500 text-brand-600" : " border-b border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")}
              onClick={(event: any) => handleTabChange(event)}
              aria-current="page"
            >
              Auth Rules
            </a>
          </nav>
        </div>

        {/* Might want to extract this out into a component within this file too */}
        <div className="mt-6">
          <div>
            <div className="mt-5">
              <dd className="mt-8 text-2xl text-gray-800">
                {TabMarkup[tabId].header}
              </dd>
              <dd className="mt-8 text-base text-gray-500">
                {TabMarkup[tabId].description}
              </dd>
            </div>
            <button
              type="button"
              className="mt-8 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              {TabMarkup[tabId].cta}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Tabs
