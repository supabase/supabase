export const transformLogsToJSON = (log: string) => {
  try {
    let jsonString = log.replace('[pg_stat_monitor] ', '')
    jsonString = jsonString.replace(/""/g, '","')
    const jsonObject = JSON.parse(jsonString)
    return jsonObject
  } catch (error) {
    return null
  }
}
