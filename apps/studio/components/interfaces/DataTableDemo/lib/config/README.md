**Goal: deploy data-tables via config files**

Requirement:

- Simple API endpoint to receive configuration
- Simple CLI command to deploy configuration (using API)
- Simple Typescript SDK to validate the configuration OR go straight up for `yaml`
- Versioning

> Versioning is crucial as we will do lots of breaking changes at the beginning. Maybe we can start with commit/version/date versioning (e.g. logs.run/v1, logs.run/eab5f3, logs.run/2025-03).

Questions:

- How to validate config file in general (runtime, not compiled via TS)
- How to pass `components` to the

Config file should include:

- filter fields
