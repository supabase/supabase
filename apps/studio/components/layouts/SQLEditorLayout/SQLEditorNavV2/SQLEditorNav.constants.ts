export type SectionState = {
  shared: boolean
  favorite: boolean
  private: boolean
  logs: boolean
  community: boolean
}

export const DEFAULT_SECTION_STATE: SectionState = {
  shared: false,
  favorite: false,
  private: true,
  logs: false,
  community: true,
}
