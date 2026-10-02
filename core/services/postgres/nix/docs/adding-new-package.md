# Adding a new extension package

!!! tip "Understanding the Module System"
    To better understand how packages are organized and how `ourExtensions` works with flake-parts, see:

    - **[Flake-Parts Architecture](./flake-parts-architecture.md)** - Module structure overview
    - **[Flake-Parts and nixpkgs lib](./flake-parts-nixpkgs-lib.md)** - Extension composition patterns

## Pre-packaging steps
1. Make sure you have nix installed [Nix installer](https://github.com/DeterminateSystems/nix-installer)
2. Create a branch off of `develop`


## C/C++ postgres extensions

If you are creating a C/C++ extension, the pattern found in https://github.com/supabase/postgres/blob/develop/nix/ext/pgvector.nix will work well.

```
{ lib, stdenv, fetchFromGitHub, postgresql }:

stdenv.mkDerivation rec {
  pname = "pgvector";
  version = "0.7.4";

  buildInputs = [ postgresql ];

  src = fetchFromGitHub {
    owner = "pgvector";
    repo = pname;
    rev = "refs/tags/v${version}";
    hash = "sha256-qwPaguQUdDHV8q6GDneLq5MuhVroPizpbqt7f08gKJI=";
  };

  installPhase = ''
    mkdir -p $out/{lib,share/postgresql/extension}

    cp *.so      $out/lib
    cp sql/*.sql $out/share/postgresql/extension
    cp *.control $out/share/postgresql/extension
  '';

  meta = with lib; {
    description = "Open-source vector similarity search for Postgres";
    homepage = "https://github.com/${src.owner}/${src.repo}";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };
}
```

This uses `stdenv.mkDerivation` which is a general nix builder for C and C++ projects (and others). It can auto detect the Makefile, and attempt to use it. ***It's a good practice to not have steps in the Makefile of your project that try to deal with OS specific system paths, or make calls out to the internet, as Nix cannot use these steps to build your project.*** 

Your build should produce all of the sql and control files needed for the install phase.

1. Once you have created this file, you can add it to `nix/ext/<yourname>.nix` and edit `nix/packages/postgres.nix` and add it to the `ourExtensions` list.
2. `git add .` as nix uses git to track changes 
3. In your package file, temporarily empty the `hash = "sha256<...>=";` to `hash = "";` and save and `git add .`
4. Run `nix build .#psql_15.exts.<yourname>`  to try to trigger a build, nix will print the calculated sha256 value that you can add back the the `hash` variable, save the file again, and re-run `nix build .#psql_15.exts.<yourname>`. 
5. Add any needed migrations into the `supabase/postgres` migrations directory.
6. You can then run tests locally to verify that the update of the package succeeded. 
7. Now it's ready for PR review!

## Extensions written in Rust that use `buildPgrxExtension` builder

Extensions like:

* https://github.com/supabase/postgres/blob/develop/nix/ext/wrappers/default.nix
* https://github.com/supabase/postgres/blob/develop/nix/ext/pg_graphql.nix
* https://github.com/supabase/postgres/blob/develop/nix/ext/pg_jsonschema.nix

Are written in Rust, built with `cargo`, and need to use https://github.com/pgcentralfoundation/pgrx to build the extension.

We in turn have a special nix package `builder` which is sourced from `nixpkgs` and called `buildPgrxExtension` 

A simple example is found in `pg_jsonschema`


```
{ lib, stdenv, fetchFromGitHub, postgresql, buildPgrxExtension_0_11_3, cargo }:

buildPgrxExtension_0_11_3 rec {
  pname = "pg_jsonschema";
  version = "0.3.1";
  inherit postgresql;

  src = fetchFromGitHub {
    owner = "supabase";
    repo = pname;
    rev = "v${version}";
    hash = "sha256-YdKpOEiDIz60xE7C+EzpYjBcH0HabnDbtZl23CYls6g=";
  };

  nativeBuildInputs = [ cargo ];
  buildInputs = [ postgresql ];
  # update the following array when the pg_jsonschema version is updated
  # required to ensure that extensions update scripts from previous versions are generated

  previousVersions = ["0.3.0" "0.2.0" "0.1.4" "0.1.4" "0.1.2" "0.1.1" "0.1.0"];
  CARGO="${cargo}/bin/cargo";
  env = lib.optionalAttrs stdenv.isDarwin {
    POSTGRES_LIB = "${postgresql}/lib";
    RUSTFLAGS = "-C link-arg=-undefined -C link-arg=dynamic_lookup";
  };
  cargoHash = "sha256-VcS+efMDppofuFW2zNrhhsbC28By3lYekDFquHPta2g=";

  # FIXME (aseipp): testsuite tries to write files into /nix/store; we'll have
  # to fix this a bit later.
  doCheck = false;

  preBuild = ''
    echo "Processing git tags..."
    echo '${builtins.concatStringsSep "," previousVersions}' | sed 's/,/\n/g' > git_tags.txt
  '';

  postInstall = ''
    echo "Creating SQL files for previous versions..."
    current_version="${version}"
    sql_file="$out/share/postgresql/extension/pg_jsonschema--$current_version.sql"
    
    if [ -f "$sql_file" ]; then
      while read -r previous_version; do
        if [ "$(printf '%s\n' "$previous_version" "$current_version" | sort -V | head -n1)" = "$previous_version" ] && [ "$previous_version" != "$current_version" ]; then
          new_file="$out/share/postgresql/extension/pg_jsonschema--$previous_version--$current_version.sql"
          echo "Creating $new_file"
          cp "$sql_file" "$new_file"
        fi
      done < git_tags.txt
    else
      echo "Warning: $sql_file not found"
    fi
    rm git_tags.txt
  '';


  meta = with lib; {
    description = "JSON Schema Validation for PostgreSQL";
    homepage = "https://github.com/supabase/${pname}";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };
}
```

Here we have built support in our overlay to specify and pin the version of `buildPgrxExtension` to a specific version (in this case `buildPgrxExtension_0_11_3`). This is currently the only version we can support, but this can be extended in our overlay https://github.com/supabase/postgres/blob/develop/nix/overlays/cargo-pgrx-0-11-3.nix to support other versions.

A few things about `buildPgrxExtension_x`:

* It doesn't support `buildPhase`, `installPhase` and those are implemented directly in the builder already
* It mostly just allows `cargo build` to do it's thing, but you may need to set env vars for the build process as seen above 
* It calculates a special `cargoHash` that will be generated after the first in `src` is generated, when running `nix build .#psql_15.exts.<yourname>` to build the extension


## Post Nix derivation release steps


1. You can add and run tests as described in https://github.com/supabase/postgres/blob/develop/nix/docs/adding-tests.md 
2. You may need to add tests to our test.yml gh action workflow as well.
3. You can add the package and name and version to `ansible/vars.yml` it is not necessary to add the sha256 hash here, as the package is already built and cached in our release process before these vars are ever run.
4. to check that all your files will land in the overall build correctly, you can run `nix profile install .#psql_15.bin` on your machine, and check in `~/.nix-profile/bin, ~/.nix-profile/lib, ~/.nix-profile/share/postgresql/*` and you should see your lib, .control and sql files there. 
5. You can also run `nix run .#start-server 15` and in a new terminal window run `nix run .#star-client-and-migrate 15` and try to `CREATE EXTENSION <yourname>` and work with it there
6. Check that your extension works with the `pg_upgrade` process (TODO documentation forthcoming)
7. Now you are ready to PR the extension
8. From here, the release process should typically take care of the rest. 
