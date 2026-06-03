export type SectionState = {
  snippets: boolean
  shared: boolean
  favorite: boolean
  private: boolean
  reports: boolean
  chats: boolean
}

export const SQL_EDITOR_NAV_CONTENT_CLASSNAME = 'pt-3'

export const SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME = 'px-3 py-2'

export const SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME =
  'flex-1 min-w-0 px-0 heading-meta text-foreground-light'

export const SQL_EDITOR_NAV_LIST_INSET_CLASSNAME = 'px-2'

export const SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME = 'h-7'

export const SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME = 'text-sm'

export const SQL_EDITOR_NAV_ITEM_ICON_CLASSNAME = 'shrink-0 text-foreground-muted'

export const SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME = 'shrink-0 text-foreground-light'

export const SQL_EDITOR_NAV_LIST_GAP_CLASSNAME = 'gap-0.5'

/** Matches sidebar search input and create menu button height in {@link SQLEditorMenu}. */
export const SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME = 'h-[32px] md:h-[28px]'

/** Shared chrome for the SQL sidebar search row and editor tab bar. */
export const SQL_EDITOR_CHROME_HEADER_CLASSNAME =
  'flex shrink-0 items-center border-b border-default bg-dash-sidebar px-3 py-2'

export const DEFAULT_SECTION_STATE: SectionState = {
  snippets: true,
  shared: false,
  favorite: false,
  private: true,
  reports: true,
  chats: true,
}
