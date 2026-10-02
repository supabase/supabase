# Nix development and build environment

With Nix it's possible to quickly and reliably recreate the full environments
for developing, testing and building PostgREST.

## Getting started with Nix

You'll need to [get Nix](https://nixos.org/download.html). Follow the recommended installation for your operating system from the official download website.

## Building PostgREST

To build PostgREST from your local checkout of the repository, run:

```bash
$ nix-build --attr postgrestPackage

```

This will create a `result` directory that contains the PostgREST binary at
`result/bin/postgrest`. The `--attr` parameter (or short: `-A`) tells Nix to
build the `postgrestPackage` attribute from the Nix expression it finds in our
`default.nix` (see below for details). Nix will take care of getting the right
GHC version and all the build dependencies.

You can also build a statically linked binary with:

```bash
$ nix-build --attr postgrestStatic

$ ldd result/bin/postgrest
$       not a dynamic executable
```

## Binary cache

We recommend that you use the PostgREST binary cache on
[cachix](https://cachix.org/):

```bash
# Install cachix:
$ nix-env -iA cachix -f https://cachix.org/api/v1/install

# Set cachix up to use the PostgREST binary cache:
$ cachix use postgrest

```

Without cachix, your machine will have to rebuild all the dependencies that are
derived on top of `Musl` for the static builds, which can take a very long time.

## Developing

A development environment for PostgREST is available with `nix-shell`. The
following command will put you into a new shell that has GHC and Cabal on the
PATH:

```bash
$ nix-shell

```

Within `nix-shell`, you can run Cabal commands as usual. You can also run
stack with the `--nix` option, which causes stack to pick up the non-Haskell
dependencies from the same pinned Nixpkgs version that the Nix builds use.

## Working with `nix-shell` and the PostgREST utility scripts

The PostgREST utilities available in `nix-shell` all have names that begin with
`postgrest-`, so you can use tab completion (typing `postgrest-` and pressing
`<tab>`) in `nix-shell` to see all that are available:

```bash
[nix-shell]$ postgrest-<tab>
postgrest-build
postgrest-cabal-update
postgrest-check
postgrest-clean
postgrest-commitlint
...
```

Most of these commands provide a `--help` output, make sure to check it out.

To run one-off commands, you can also use `nix-shell --run <command>`, which
will launch the Nix shell, run that one command and exit. Note that the tab
completion will not work with `nix-shell --run`, as Nix has yet to evaluate
our Nix expressions to see which utilities are available.

```bash
$ nix-shell --run postgrest-test-spec

# Note that you need to quote any arguments that you would like to pass to
# the command to be run in nix-shell:
$ nix-shell --run "postgrest-foo --bar"

```

If you use `nix-shell` very often, you might like to use
https://github.com/xzfc/cached-nix-shell, which skips evaluating all our Nix
expressions if nothing changed, reducing startup time for the shell
considerably.

Note: Once inside nix-shell, the utilities work from any directory inside
the PostgREST repo. Paths are resolved relative to the repo root:

```bash
[nix-shell]$ cd src
# Even though the current directory is ./src, the config path must still start
# from the repo root:
[nix-shell]$ postgrest-run test/io/configs/simple.conf
```

## Testing

In nix-shell, you'll find utility scripts that make it very easy to run our
test suite, including setting up all required dependencies and
temporary test databases:

```bash
# Run the tests against the most recent version of PostgreSQL:
$ nix-shell --run postgrest-test-spec

# Run the tests against all supported versions of PostgreSQL:
$ nix-shell --run "postgrest-with-all postgrest-test-spec"

# Run the tests against a specific version of PostgreSQL (use tab-completion in
# nix-shell to see all available versions):
$ nix-shell --run "postgrest-with-pg-17 postgrest-test-spec"

```

The io-test that test PostgREST as a black box with inputs and outputs can be
run with `postgrest-test-io`. The test runner under the hood is
[pytest](https://docs.pytest.org/) and you can pass it the usual options:

```bash
# Filter the tests to run by name, including all that contain 'config':
[nix-shell]$ postgrest-test-io -k config

# Run tests in parallel using xdist, specifying the number of processes:
[nix-shell]$ postgrest-test-io -n auto
[nix-shell]$ postgrest-test-io -n 8
```

The memory tests check that we don't surpass a memory threshold for big request bodies.

```bash
# Build the dependencies needed for the memory test
$ nix-shell --arg memory true

# Run the memory test
[nix-shell]$ postgrest-test-memory
```

The loadtests ensure that performance doesn't drop on a change. Underlyingly they use
[vegeta](https://github.com/tsenart/vegeta).

```bash
# Run the loadtests on the latest commit(HEAD)
[nix-shell]$ postgrest-loadtest

# You can loadtest comparing to a different branch
[nix-shell]$ postgrest-loadtest-against main

# Produce a markdown report to be used on CI
[nix-shell]$ postgrest-loadtest-report
```

doctests for some of our modules are also available:

```bash
[nix-shell]$ postgrest-test-doctest
```

## Code coverage

Code coverage is available under the `postgrest-coverage` command. This will produce a `./coverage` directory that can be visualized on a browser.

```bash
# Will run all the tests and produce a coverage dir
[nix-shell]$ postgrest-coverage
...

postgrest-coverage: To see the results, visit file://$(pwd)/coverage/check/hpc_index.html
```

## Linting and styling code

The nix-shell also contains configuration for linting and styling the PostgREST
source code:

```bash
nix-shell --run treefmt
```

## Documentation

The following commands can help you when working on the PostgREST docs:

```bash
# Build the docs
[nix-shell]$ postgrest-docs-build

# Build the docs and start a livereload server on `http://localhost:5500`
[nix-shell]$ postgrest-docs-serve

# Run aspell, to verify spelling mistakes
[nix-shell]$ postgrest-docs-spellcheck

# Detect obsolete entries in postgrest.dict
[nix-shell]$ postgrest-docs-dictcheck

# Build and run all the validation scripts
[nix-shell]$ postgrest-docs-check
```

## General development tools

Tools like `postgrest-build`, `postgrest-run`, `postgrest-repl` etc. are simple wrappers around
`cabal` and should do what you expect. `postgrest-check` runs most checks that will
also run in CI, with the exception of the IO and Memory checks that need to be run
separately.

`postgrest-with-pg-*` take a command as an argument and will run it
with a temporary database. `postgrest-with-all` will run the command against
all supported PostgreSQL versions. Tests run without `postgrest-with-*` are
run against the latest PostgreSQL version by default.

`postgrest-watch` takes a command as an argument that it will re-run if any source
file is changed. For example, `postgrest-watch postgrest-with-all postgrest-test-spec`
will re-run the full spec test suite against all PostgreSQL versions on every change.

## REPL

You can use `postgrest-repl` to manually inspect the PostgREST modules.

```bash
$ postgrest-repl

ghci> import PostgREST.<tab>
PostgREST.Admin                        PostgREST.Config.Database              PostgREST.Plan.MutatePlan              PostgREST.Response.OpenAPI
PostgREST.ApiRequest                   PostgREST.Config.JSPath                PostgREST.Plan.ReadPlan                PostgREST.SchemaCache
...

ghci> import PostgREST.MediaType
ghci> decodeMediaType "application/json"
MTApplicationJSON
```

## Working with locally modified Haskell packages

Sometimes, we need to modify Haskell libraries in order to debug them or enhance them.
For example, if you want to debug the [`hasql-pool`](https://hackage.haskell.org/package/hasql-pool)
library:

First, copy the package to the repo root. We'll use GitHub in this example.

```bash
$ git clone --depth=1 --branch=0.10.1 https://github.com/nikita-volkov/hasql-pool.git
$ rm -rf ./hasql-pool/.git
```

Then, pin the local package to the [`haskell-packages.nix`](./overlays/haskell-packages.nix) file.

```nix
  overrides =
    # ...
    rec {

      # Different subpath may be needed if the cabal file is not in the library's base directory
      hasql-pool = lib.dontCheck
        (prev.callCabal2nixWithOptions "hasql-pool" ../../hasql-pool "--subpath=." {} );

    };
```

Next, both [`cabal.project`](/cabal.project) and [`stack.yaml`](/stack.yaml) need to be updated
with the local library:

```cabal
-- cabal.project
packages:
  ./hasql-pool/hasql-pool.cabal
```

```yaml
# stack.yaml
extra-deps:
  - ./hasql-pool/hasql-pool.cabal
```

Lastly, run `nix-shell` to build the local package. You don't need to exit and
enter the Nix shell every time you modify the library's code, re-executing
`postgrest-run` should be enough.

This is done for development purposes only. Local libraries must not be left
in production ready code.

## Tour

The following is not required for working on PostgREST with Nix, but it will
give you some more background and details on how it works.

### `default.nix`

[`default.nix`](../default.nix) is our 'repository expression' that pulls all
the pieces that we define with Nix together. It returns a set (like a dict in
other programming languages), where each attribute is a derivation that Nix
knows how to build, like the `postgrest` attribute from earlier.

Internally, our `default.nix` uses the `pkgs.callPackage` function to import
the modules that we defined in the `nix` directory. It automatically passes the
arguments those modules require if they are available in `pkgs` (this means
that `pkgs` is defined in terms of itself, better not to think too much about
that).

We also use `default.nix` to load our pinned version of the `nixpkgs`
repository. This set of packages will always be the same, independently from
where or when you use it. The pinned version is taken from `flake.lock` and
can be updated with `postgrest-nixpkgs-upgrade`.

### `shell.nix`

[`shell.nix`](../shell.nix) defines an environment in which PostgREST can be
built and developed. It extends the build environment from our `postgrest`
attribute with useful utilities that will be put on the PATH in `nix-shell`.

### `nix/overlays`

Our overlays to the Nix package set are defined here. They allow us to tweak our
`pkgs` in `default.nix` by adding new packages or overriding existing ones.

## Upgrading dependencies

See the [upgrading checklist](UPGRADE.md) for how to upgrade the PostgREST
dependencies.
