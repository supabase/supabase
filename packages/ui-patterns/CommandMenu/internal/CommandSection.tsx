const toSectionId = (str: string) => str.toLowerCase().replace(/\s+/g, '-')

const section$new = (
  name: string,
  { forceMount = false, id }: { forceMount?: boolean; id?: string } = {}
) => ({
  id: id ?? toSectionId(name),
  name,
  forceMount,
  commands: [],
})

export { section$new }
