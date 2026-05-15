export const getDatabaseTriggersHref = (
  projectRef: string | null | undefined,
  name: string | null | undefined
): string => {
  return `/project/${projectRef ?? ''}/database/triggers?search=${encodeURIComponent(name ?? '')}`
}
