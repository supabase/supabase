# Pipeline region prototype

UI-only preview. Supported mock choices are North Virginia, Frankfurt, and Singapore. Creation defaults to the source database region when it matches a choice, otherwise the existing environment region. The form keeps the choice between steps and displays it in review.

Existing pipeline connection details and diagram edges use the existing environment region as deterministic mock placement. This represents the pipeline execution region, not the destination region.

Selections are not persisted and are not sent to the API. Creating a pipeline still uses existing backend placement. Replace these mock values with API-supported regions and persisted pipeline placement before shipping.

Connection details show the source project region from project metadata. Destination storage region is shown only when the stored DuckLake or Analytics Bucket configuration supplies `s3_region`. Connection details and destination nodes display it as the configured value, without inferring a physical location or flag for custom S3-compatible endpoints. Catalog location is not inferred from its host.
