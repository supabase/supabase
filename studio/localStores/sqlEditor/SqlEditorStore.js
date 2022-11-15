import { createContext, useContext } from 'react'
import { makeAutoObservable, toJS } from 'mobx'

import { IS_PLATFORM } from 'lib/constants'
import Tab from './Tab'
import QueryTab from './QueryTab'
import Favorite from './Favorite'
import { SchemasQuery, TableColumnsQuery, AllFunctionsQuery } from './queries'
import { isUndefined } from 'lodash'

let store = null
let projectRef = null
let metaProjectRef = null
export function useSqlEditorStore(ref, meta) {
  if ((ref && ref !== projectRef) || (meta?.projectRef && meta.projectRef !== metaProjectRef)) {
    projectRef = ref
    metaProjectRef = meta.projectRef
    store = new SqlEditorStore(ref, meta)
  }

  if (!ref || !meta) {
    store = null
  }

  return store
}

export const TAB_TYPES = {
  WELCOME: 'WELCOME',
  SQL_QUERY: 'SQL_QUERY',
}

export const UTILITY_TAB_TYPES = {
  RESULTS: 'RESULTS',
}

export const SqlEditorContext = createContext(null)

export const useSqlStore = () => {
  return useContext(SqlEditorContext)
}

class SqlEditorStore {
  meta
  projectRef
  localStorageKey
  tabs = []
  favorites = []
  selectedTabId

  keywordCache = []
  schemaCache = []
  tableCache = []
  functionCache = []

  constructor(projectRef, meta) {
    makeAutoObservable(this, {
      keywordsCache: false,
      schemaCache: false,
      tableCache: false,
      functionCache: false,
    })

    this.meta = meta
    this.projectRef = projectRef
    this.localStorageKey = `supabase-sql-${projectRef}`

    this.loadKeywords()
    this.loadSchemas()
    this.loadTablesAndColumns()
    this.loadAllFunctions()
  }

  get LOCALSTORAGE_SAVED_KEY() {
    return `supabase-queries-state-${this.projectRef}`
  }

  get activeTab() {
    if (this.tabs.length === 1) {
      this.selectedTabId = this.tabs[0].id
    }

    const found = this.tabs.find((x) => x.id === this.selectedTabId)
    return found
  }

  get nextQueryTabName() {
    for (var i = 1; i < 20; i++) {
      const name = `Query-${i}`
      const found = this.tabs.find((x) => x.name.includes(name))
      if (found == undefined) return name
    }
    return `Query`
  }

  get isActiveQueyTabFavorited() {
    if (this.activeTab.type != TAB_TYPES.SQL_QUERY) return false
    return this.favorites.find((x) => x.key === this.activeTab.id) !== undefined
  }

  get tabsJson() {
    const json = this.tabs.map((x) => {
      switch (x.type) {
        case TAB_TYPES.WELCOME:
          return { name: x.name, type: x.type }
        case TAB_TYPES.SQL_QUERY:
          return { id: x.id, name: x.name, desc: x.desc, type: x.type, query: x.query }
        default:
          return undefined
      }
    })
    return json
  }

  get favoriteCards() {
    return this.favorites.filter((x) => !!x.name)
  }

  get isExecuting() {
    const tab = this.activeTab
    if (tab.type != TAB_TYPES.SQL_QUERY) return false
    else return tab.isExecuting
  }

  tabsFromContentStore(contentStore, user_id) {
    const snippets = contentStore
      .sqlSnippets((x) => x.owner_id === user_id)
      .map((snippet) => toJS(snippet))

    // add the welcome tab
    let tabs = IS_PLATFORM ? [new Tab('Welcome', TAB_TYPES.WELCOME)] : []

    // add the tabs to array, but with structure the localStore expects
    snippets.forEach((snippet) => {
      const data = {
        desc: snippet.description,
        id: snippet.id,
        name: snippet.name,
        query: snippet.content.sql,
        type: 'SQL_QUERY',
        favorite: snippet.content.favorite,
      }

      tabs.push(data)
    })

    return tabs
  }

  /*
   * ! Temporary solution !
   *
   * New action for retriving data from main db user_content
   * You need to pass the contentStore into this
   */
  async loadRemotePersistentData(contentStore, user_id) {
    await contentStore.load()

    const tabs = this.tabsFromContentStore(contentStore, user_id)

    /*
     * Reshape snippet content to fit the SqlEditorStore shape
     */
    const payload = {
      version: '1.0',
      tabs: [...tabs],
      favorites: [],
    }

    /*
     * Run loadPersistentData() as normal, although now with remote data
     */
    this.loadPersistentData(payload)
  }

  loadPersistentData(json) {
    if (!json) {
      this.loadInitialData()
      return
    }

    if ('version' in json) {
      this.loadTabs(json.tabs || [])
    } else if ('results' in json) {
      // legacy saved data
      this.loadLegacyTabs(json.results || [])
    }

    this.loadFavorites(json.favorites || [])

    this.loadPreviousSession()
  }

  loadInitialData() {
    this.tabs = [
      new Tab('Welcome', TAB_TYPES.WELCOME),
      // new Tab('scripts', TAB_TYPES.WELCOME),
      // new Tab('quickstarts', TAB_TYPES.WELCOME),
      new QueryTab(this.nextQueryTabName, TAB_TYPES.SQL_QUERY),
    ]
    this.selectedTabId = this.tabs[0].id
  }

  // for previous sql editor saved data
  loadLegacyTabs(values) {
    let tabs = [new Tab('Welcome', TAB_TYPES.WELCOME)]
    tabs = tabs.concat(
      values.map((x, index) => {
        const tab = new QueryTab(this.meta, `Query-${index + 1}`, TAB_TYPES.SQL_QUERY)
        tab.id = x.key
        tab.query = x.query
        return tab
      })
    )
    this.tabs = tabs
    this.selectedTabId = this.tabs.length ? this.tabs[0].id : undefined
  }

  loadTabs(values, autoSelectTab = true) {
    const tabs = values.map((x) => {
      switch (x.type) {
        case TAB_TYPES.WELCOME:
          return new Tab(x.name, x.type)
        case TAB_TYPES.SQL_QUERY:
          const tab = new QueryTab(this.meta, x.name, x.type, x.desc, x.favorite || false)
          tab.id = x.id
          tab.query = x.query
          return tab
        default:
          return undefined
      }
    })

    this.tabs = tabs.filter((x) => x !== undefined)

    if (autoSelectTab) {
      this.selectedTabId = this.tabs.length ? this.tabs[0].id : undefined
    }
  }

  loadFavorites(values) {
    this.favorites = values.map((x) => new Favorite(x.key, x.query, x.name, x.desc))
  }

  loadPreviousSession() {
    const tabId = localStorage.getItem(this.localStorageKey)
    const allSnippets = this.tabs.concat(this.favorites)
    const selectedTab = allSnippets.find((tab) => tab.id === tabId)

    if (!isUndefined(selectedTab)) {
      this.selectTab(selectedTab.id)
    }
  }

  async loadKeywords() {
    const query = 'select * from pg_get_keywords();'
    const response = await this.meta.query(query)
    if (response && !response.error) {
      this.keywordCache = response.map((x) => x.word.toLocaleLowerCase())
    }
  }

  async loadSchemas() {
    const response = await this.meta.query(SchemasQuery)
    if (!response.error) {
      this.schemaCache = response
    }
  }

  async loadTablesAndColumns() {
    const response = await this.meta.query(TableColumnsQuery)
    if (!response.error) {
      this.tableCache = response
    }
  }

  async loadAllFunctions() {
    const response = await this.meta.query(AllFunctionsQuery)
    if (!response.error) {
      this.functionCache = response.map((x) => {
        const args = x.argument_types
          .split(',')
          .filter((a) => a)
          .map((a) => a.trim())
        return { ...x, args }
      })
    }
  }

  selectTab(id) {
    // Save selected tab in local storage
    localStorage.setItem(this.localStorageKey, id)

    // reset new selected query tab
    const found = this.tabs.find((x) => x.id === this.selectedTabId)
    if (found && found.type == TAB_TYPES.SQL_QUERY) {
      found.isExecuting = false
    }

    this.selectedTabId = id
  }

  closeTab(id) {
    const tabs = this.tabs.filter((x) => x.id !== id)
    // if user close selectedTab, select the last tab if available
    if (tabs.length && this.selectedTabId === id) {
      const nextId = tabs[tabs.length - 1].id

      if (nextId) {
        this.selectedTabId = nextId
      }
    }
  }

  createQueryTab(query, name) {
    const newTab = new QueryTab(this.meta, name ? name : this.nextQueryTabName, TAB_TYPES.SQL_QUERY)
    newTab.setQuery(query)

    this.tabs.push(newTab)
    this.selectedTabId = newTab.id
  }

  createQueryTabFromFavorite(key) {
    const foundTab = this.tabs.find((x) => x.id == key)
    if (foundTab) {
      this.selectedTabId = foundTab.id
      return
    }

    const foundFav = this.favorites.find((x) => x.key == key)
    if (foundFav) {
      const newTab = new QueryTab(this.meta, foundFav.name, TAB_TYPES.SQL_QUERY, foundFav.desc)
      newTab.id = foundFav.key
      newTab.query = foundFav.query

      this.tabs.push(newTab)
      this.selectedTabId = newTab.id
    }
  }

  reorderTabs(startIndex, endIndex) {
    const result = Array.from(this.tabs)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    this.tabs = result
  }

  addToFavorite(key, query, name, desc) {
    const found = this.favorites.find((x) => x.key === key)
    if (!found) {
      const newFav = new Favorite(key, query, name, desc)
      this.favorites = [newFav, ...this.favorites]
    }
  }

  unFavorite(key) {
    this.favorites = this.favorites.filter((x) => x.key != key)
  }

  renameQuery(id, model) {
    const found = this.tabs.find((x) => x.id === id)
    found?.rename(model)

    const favorite = this.favorites.find((x) => x.key === id)
    favorite?.rename(model)
  }

  async startExecuting(query) {
    const tab = this.activeTab
    if (!tab || tab.type != TAB_TYPES.SQL_QUERY) return

    await tab.startExecuting(query)
  }
}

export default SqlEditorStore
