There are basically two types of tests you can add:

- pgTAP based tests, and
- pg\_regress tests
- Migration tests.

In all cases, a number of extensions may be installed into the database for
use; you can see those in both `/nix/tests/postgresql.conf.in`
and `/nix/tests/prime.sql` (extensions may be enabled in either place.)

## pg\_regress tests

pg\_regress tests are in `/nix/tests/sql/` with output in `/nix/tests/expected/`.
To create a new test, create a new SQL file in `/nix/tests/sql/`.

Next, for each current major version of postgres, we run a "flake check" build one at a time.

Examples:

```
nix build .#checks.aarch64-darwin.psql_15 -L
nix build .#checks.aarch64-darwin.psql_17 -L
nix build .#checks.aarch64-darwin.psql_orioledb-17 -L
```

(Note that the evaluation and nix build of the postgres packages "bundle" of each major version must succeed here, even though we run one version at a time. If you made changes to postgres or extensions, or wrappers those may rebuild here when you run this. Otherwise they will usually download the prebuilt version from the supabase nix binary cache)

Next, review the logs to identify where the test output was written

```
postgres> CREATE EXTENSION IF NOT EXISTS index_advisor;
postgres> CREATE EXTENSION
postgres> (using postmaster on localhost, port 5432)
postgres> ============== running regression test queries        ==============
postgres> test new_test                     ... diff: /nix/store/5gk419ddz7mzzwhc9j6yj5i8lkw67pdl-tests/expected/new_test.out: No such file or directory
postgres> diff command failed with status 512: diff  "/nix/store/5gk419ddz7mzzwhc9j6yj5i8lkw67pdl-tests/expected/new_test.out" "/nix/store/2fbrvnnr7iz6yigyf0rb0vxnyqvrgxzp-postgres-15.6-check-harness/regression_output/results/new_test.out" > "/nix/store/2fbrvnnr7iz6yigyf0rb0vxnyqvrgxzp-postgres-15.6-check-harness/regression_output/results/new_test.out.diff
```

and copy the `regression_output` directory to where you can review

```
cp -r /nix/store/2fbrvnnr7iz6yigyf0rb0vxnyqvrgxzp-postgres-15.6-check-harness/regression_output .
```

Then you can review the contents of `regression_output/results/new_test.out` to see if it matches what you expected.

If it does match your expectations, copy the file to `/nix/tests/expected/` and the test will pass on the next run.

If the output does not match your expectations, update the `<new_test>.sql` file, re-run with `nix flake check -L` and try again


## pgTAP tests

These are super easy: simply add `.sql` files to the
`/nix/tests/smoke/` directory, then:

```
nix flake check -L
```

(`-L` prints logs to stderrr, for more details see `man nix`)

These files are run using `pg_prove`; they pretty much behave exactly like how
you expect; you can read
[the pgTAP documentation](https://pgtap.org/documentation.html) for more.

For a good example of a pgTAP test as a pull request, check out
[pull request #4](https://github.com/supabase/nix-postgres/pull/4/files).

## Re-running tests

`nix flake check` gets its results cached, so if you do it again the tests won't rerun. If you change a file then it will run again.

<!-- If you want to force rerun without modifying a file, you can do:

```
nix build .#checks.x86_64-linux.psql_15 --rebuild
nix build .#checks.x86_64-linux.psql_16 --rebuild
```
-->

Limitation: currently there's no way to rerun all the tests, so you have to specify the check attribute.

To get the correct attribute (`#checks.x86_64-linux.psql_15` above), you can do `nix flake show`. This will show a tree with all the output attributes.

## Migration tests

> **NOTE**: Currently, migration tests _do not happen in CI_. They can only be
> run manually.

Migration tests are pretty simple in the sense they follow a very simple
principle:

- You put data in the database
- Run the migration procedure
- It should probably not fail

Step 1 and 2 are easy, and for various reasons (e.g. mistakes from upstream
extension authors), step 3 isn't guaranteed, so that's what the whole idea is
designed to test.

To add data into the database, modify the
`/nix/tests/migrations/data.sql` script and add whatever you want into
it. This script gets loaded into the old version of the database at startup, and
it's expected that the new version of the database can handle it.

To run the `migration-test` tool, check out the documentation on
[migration-tests](./migration-tests.md).
