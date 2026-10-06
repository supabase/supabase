import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'

export const describeBigQueryTableLayout = (
  option: NonNullable<DestinationPanelSchemaType['tableOptions']>[number]
) => {
  const partition = option.partitionBy
  let partitionDescription = 'No partitioning'
  if (partition?.kind === 'time_column') {
    partitionDescription = `Partition by ${partition.column} (${partition.granularity ?? 'day'})`
  }
  if (partition?.kind === 'ingestion_time') {
    partitionDescription = `Partition by ingestion time (${partition.granularity ?? 'day'})`
  }
  if (partition?.kind === 'integer_range') {
    partitionDescription = `Partition by ${partition.column} (range ${partition.start} to ${partition.end}, interval ${partition.interval})`
  }
  const clustering = option.clusterBy?.length
    ? `Cluster by ${option.clusterBy.join(', ')}`
    : 'No clustering'
  return `${partitionDescription}; ${clustering}`
}
