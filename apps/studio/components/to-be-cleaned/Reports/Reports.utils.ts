import { useProjectContentStore } from 'stores/projectContentStore'
import { NEW_REPORT_SKELETON } from './Reports.constants'

/*
 * createReport()
 *
 * Creates a new report with a basic skeleton
 * also pushes route to new report
 *
 * returns :object
 */
export const createReport = async ({ router }: any) => {
  const { ref } = router.query
  // [Alaister] despite it's name, useProjectContentStore is not a real react hook
  // so we can safely disable the eslint rule here
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const contentStore = useProjectContentStore(ref)
  const { data: newReport, error } = await contentStore.create(NEW_REPORT_SKELETON)

  if (error) throw error

  await contentStore.load()
  router.push(`/project/${ref}/reports/${newReport[0].id}`)
}

/*
 * deleteReport()
 *
 * Deletes a new report with a basic skeleton
 * also pushes route another report in list
 *
 * returns :object
 */
export const deleteReport = async ({ router, id }: any) => {
  const { ref } = router.query
  // [Alaister] despite it's name, useProjectContentStore is not a real react hook
  // so we can safely disable the eslint rule here
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const contentStore = useProjectContentStore(ref)
  const { data: delReport, error } = await contentStore.del(id)

  if (error) throw error

  await contentStore.load()
  // push route to report index
  router.push(`/project/${ref}/reports`)
  return delReport
}
