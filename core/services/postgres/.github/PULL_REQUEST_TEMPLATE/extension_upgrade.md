## What kind of change does this PR introduce?

- upgrade _extension_ from _v0.0.0_ to _v0.0.0_

## Additional context

Add any other context or screenshots.

## Action Items

- [ ] **New extension releases** were Checked for any breaking changes
- [ ] **Extensions compatibility** Checked
    * Proceed to [extensions compatibility testing](#extensions-compatibility-testing), mark as done after everything is completed
- [ ] **Backup and Restore** Checked
    * Proceed to [backup testing](#backup-testing) while extensions are enabled
        - After every restore, re-run the tests specified at point [3.1](#extensions-compatibility-testing)

### Extensions compatibility testing

1. Enable every extension
    1. Check Postgres’ log output for any error messages while doing so
        1. This might unearth incompatibilities due to unsupported internal functions, missing libraries, or missing permissions
2. Disable every extension
    1. Check Postgres’ log output for any cleanup-related error messages
3. Re-enable each extension
    1. Run basic tests against the features they offer, e.g.:
        1. `pg_net` - execute HTTP requests
        2. `pg_graphql` - execute queries and mutations
        3. …to be filled in

### Backup Testing

Follow the testing steps steps for all the following cases:

- Pause on new Postgres version, restore on new Postgres version
- Pause on older Postgres version, restore on new Postgres version
- Run a single-file backup backup, restore the backup

#### Testing steps

1. Generate dummy data 
    * the ‘Countries’ or ‘Slack clone’ SQL editor snippets are decent datasets to work with, albeit limited
2. Save a db stats snapshot file
    * Do this by running `supa db-stats gather -p <project_ref>`
3. Backup the database, through pausing the project, or otherwise
4. Restore the backup, through unpausing the project or cli
5. Check the data has been recovered successfully
    1. Visual checks/navigating through the tables works
    2. Run `supa db-stats verify` against the project and the previously saved file