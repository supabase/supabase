AWS S3 is an object storage service offering industry-leading scalability, data availability, security, and performance. It is read-only and supports below file formats:

- CSV (with or without header line)
- [JSON Lines](https://jsonlines.org/)
- [Parquet](https://parquet.apache.org/)

The S3 Wrapper also supports below compression algorithms:

- gzip
- bzip2
- xz
- zlib

Note for CSV and JSONL files: currently all columns in S3 files must be defined in the foreign table and their types must be `text` type.
Note for Parquet files: the whole Parquet file will be loaded into local memory if it is compressed, so keep the file size as small as possible.
