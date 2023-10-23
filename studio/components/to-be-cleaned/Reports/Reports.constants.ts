export const NEW_REPORT_SKELETON = {
  name: 'new report',
  description: '',
  type: 'report',
  visibility: 'project',
  content: {
    schema_version: 1,
    period_start: {
      time_period: '7d',
      date: '',
    },
    period_end: {
      time_period: 'today',
      date: '',
    },
    interval: '1d',
    layout: [],
  },
}
