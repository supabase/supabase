export interface UserContent<
  T = Dashboards.Content | SqlSnippets.Content | LogSqlSnippets.Content
> {
  id?: string
  name: string
  description?: string
  type: 'sql' | 'report' | 'log_sql'
  visibility: 'user' | 'project' | 'org' | 'public'
  content: T
  owner_id?: number // user id
  last_updated_by?: number // user id
  inserted_at?: string // '2021-08-26T08:24:52.040695+00:00'
  owner?: Owner
  project_id?: number
  updated_at?: string // '2021-08-26T08:24:52.040695+00:00'
  updated_by?: Owner
}

export interface UserContentMap {
  [key: string]: UserContent
}

export namespace SqlSnippets {
  /**
   * To be stored in the database: public.user_content.content
   * In this case there is only one thing to store, but it's good to
   * nest it in an object for future expansion.
   */
  export interface Content {
    // unique id of the sql snippet, possibly to used so snippets can support versioning
    content_id: string

    // A full SQL query - this will be hashed on the /content endpoint
    sql: string

    // we can add some versioning to this schema in case we need to change the format.
    schema_version: string

    // show sql snippet as a favorite.
    // this could be problematic if sql snippets have visibility that is != 'user'
    favorite: boolean
  }
}

export interface Owner {
  id: number
  username: string
}

/**
 * User generated content: Dashboards
 */
export namespace Dashboards {
  /**
   * To be stored in the database: public.user_content.content
   * Time periods are considered as historical dates and can be provided as
   * an interval ("1w" = 1 week ago) or an exact date.
   */
  export interface Content {
    schema_version: 1 // we can add some versioning to this schema in case we need to change the format.

    period_start: {
      time_period?: string // "0m", "1m", "5m", "1h", "1d", "1w", "1M", "1y"
      date?: string // "2017-01-01T00:00:00.000Z"
    }
    period_end: {
      time_period?: string // "0m", "1m", "5m", "1h", "1d", "1w", "1M", "1y"
      date?: string // "2017-01-01T00:00:00.000Z"
    }
    interval: '1m' | '5m' | '1h' | '1d' | '1w' | '1M' | '1y' // this is the data interval
    layout: Chart[]
  }

  /**
   * Predefined charts
   */
  export type ChartType =
    | 'total_get_requests'
    | 'total_auth_patch_requests'
    | 'total_auth_requests'
    | 'total_egress'
    | 'total_delete_requests'
    | 'total_auth_requests'
    | 'combined_bar'
  // | 'bar'- should we include simple types as well?
  // | 'line'

  /**
   * An individual instance of a chart, with title and position
   */
  export interface Chart {
    id: string // uuid
    x: number
    y: number
    w: number
    h: number
    attribute: ChartType
    provider: 'daily-stats' | 'prometheus'
    chart_type: 'bar' | 'line' | 'area'
    // title: string // Eventually we might need this "per chart" right?
  }
}

export namespace SqlSnippets {
  /**
   * To be stored in the database: public.user_content.content
   * In this case there is only one thing to store, but it's good to
   * nest it in an object for future expansion.
   */
  export interface Content {
    // unique id of the sql snippet, possibly to used so snippets can support versioning
    content_id: string

    // A full SQL query - this will be hashed on the /content endpoint
    sql: string

    // we can add some versioning to this schema in case we need to change the format.
    schema_version: string

    // show sql snippet as a favorite.
    // this could be problematic if sql snippets have visibility that is != 'user'
    favorite: boolean
  }
}

export namespace LogSqlSnippets {
  /**
   * To be stored in the database: public.user_content.content
   * In this case there is only one thing to store, but it's good to
   * nest it in an object for future expansion.
   */
  export interface Content {
    // unique id of the sql snippet, possibly to used so snippets can support versioning
    content_id: string

    // A full SQL query - this will be hashed on the /content endpoint
    sql: string

    // we can add some versioning to this schema in case we need to change the format.
    schema_version: string

    // show sql snippet as a favorite.
    // this could be problematic if sql snippets have visibility that is != 'user'
    favorite: boolean
  }
}
