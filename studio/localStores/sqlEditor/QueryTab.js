import { makeObservable, observable, action, computed } from 'mobx'
import { compact } from 'lodash'
import { UTILITY_TAB_TYPES } from './SqlEditorStore'
import MarkdownTable from 'markdown-table'

import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import Tab from './Tab'

const DEFAULT_PANEL_SIZES = [50, 50]

class QueryTab extends Tab {
  query = ''
  results
  errorResult

  isExecuting
  activeUtilityTab
  utilityTabHeight
  splitSizes
  sqlQueryError

  constructor(meta, name, type, desc, favorite) {
    super(name, type, desc, favorite)

    makeObservable(this, {
      query: observable,
      results: observable,
      isExecuting: observable,
      activeUtilityTab: observable,
      utilityTabHeight: observable,
      splitSizes: observable,
      sqlQueryError: observable,
      hasNoResult: computed,
      setActiveTab: action,
      setQuery: action,
      setResults: action,
      setSplitSizes: action,
      startExecuting: action,
      finishExecuting: action,
      resizeUtilityTab: action,
      collapseUtilityTab: action,
    })

    this.meta = meta
    this.activeUtilityTab = UTILITY_TAB_TYPES.RESULTS
    this.splitSizes = DEFAULT_PANEL_SIZES
  }

  get hasNoResult() {
    return !this.results
  }

  get csvData() {
    return compact(Array.from(this.results || []))
  }

  get markdownData() {
    if (!this.results) return 'results is empty'
    if (this.results.constructor !== Array && !!this.results.error) return this.results.error
    if (this.results.length == 0) return 'results is empty'

    const columns = Object.keys(this.results[0])
    const rows = this.results.map((x) => {
      const temp = []
      columns.forEach((col) => temp.push(x[col]))
      return temp
    })
    const table = [columns].concat(rows)
    return MarkdownTable(table)
  }

  setActiveTab(value) {
    this.activeUtilityTab = value
  }

  setQuery(query) {
    this.query = query || ''
  }

  setResults(results) {
    this.results = results
  }

  setSplitSizes(sizes) {
    this.splitSizes = sizes
  }

  async startExecuting(query) {
    this.isExecuting = true
    this.errorResult = null

    const validateQueryResponse = await this.meta.validateQuery(query || this.query)
    if (!validateQueryResponse.valid) {
      this.finishExecuting(undefined, validateQueryResponse.error)
      return
    } else {
      this.clearError()
    }

    const response = await this.meta.query(query || this.query)
    if (response.error) {
      this.finishExecuting(undefined, response.error)
    } else {
      this.finishExecuting(response)
      post(`${API_URL}/telemetry/event`, { category: 'sql_editor', action: 'sql_query_run' })
    }
  }

  finishExecuting(results, error = null) {
    this.results = results
    this.isExecuting = false
    this.activeUtilityTab = UTILITY_TAB_TYPES.RESULTS

    if (error) {
      this.sqlQueryError = error
      this.errorResult = error.message
    }

    if (this.utilityTabHeight == 0) {
      this.restorePanelSize()
    }
  }

  resizeUtilityTab(height) {
    this.utilityTabHeight = height
  }

  collapseUtilityTab() {
    this.utilityTabHeight = 0
  }

  restorePanelSize() {
    const random = parseInt(Math.random() * 100) / 100
    this.splitSizes = [DEFAULT_PANEL_SIZES[0] - random, DEFAULT_PANEL_SIZES[1] + random]
  }

  clearError() {
    this.sqlQueryError = undefined
  }
}
export default QueryTab
