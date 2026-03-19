export type SectionState = {
  shared: boolean
  favorite: boolean
  private: boolean
  community: boolean
}

export const DEFAULT_SECTION_STATE: SectionState = {
  shared: false,
  favorite: false,
  private: true,
  community: true,
}
