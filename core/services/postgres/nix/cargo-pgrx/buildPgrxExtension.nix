# preBuildAndTest and some small other bits
# taken from https://github.com/tcdi/pgrx/blob/v0.9.4/nix/extension.nix
# (but now heavily modified)
# which uses MIT License with the following license file
#
# MIT License
#
# Portions Copyright 2019-2021 ZomboDB, LLC.
# Portions Copyright 2021-2022 Technology Concepts & Design, Inc. <support@tcdi.com>.
# All rights reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
{
  lib,
  cargo-pgrx,
  pkg-config,
  rustPlatform,
  stdenv,
  writeShellScriptBin,
  defaultBindgenHook,
}:

# The idea behind: Use it mostly like rustPlatform.buildRustPackage and so
# we hand most of the arguments down.
#
# Additional arguments are:
#   - `postgresql` postgresql package of the version of postgresql this extension should be build for.
#                  Needs to be the build platform variant.
#   - `useFakeRustfmt` Whether to use a noop fake command as rustfmt. cargo-pgrx tries to call rustfmt.
#                      If the generated rust bindings aren't needed to use the extension, its a
#                      unnecessary and heavy dependency. If you set this to true, you also
#                      have to add `rustfmt` to `nativeBuildInputs`.

{
  buildAndTestSubdir ? null,
  buildType ? "release",
  buildFeatures ? [ ],
  cargoBuildFlags ? [ ],
  postgresql,
  # enable override to generate bindings using bindgenHook.
  # Some older versions of cargo-pgrx use a bindgenHook that is not compatible with the
  # current clang version present in stdenv
  bindgenHook ? defaultBindgenHook,
  # cargo-pgrx calls rustfmt on generated bindings, this is not strictly necessary, so we avoid the
  # dependency here. Set to false and provide rustfmt in nativeBuildInputs, if you need it, e.g.
  # if you include the generated code in the output via postInstall.
  useFakeRustfmt ? true,
  usePgTestCheckFeature ? true,
  ...
}@args:
let
  rustfmtInNativeBuildInputs = lib.lists.any (dep: lib.getName dep == "rustfmt") (
    args.nativeBuildInputs or [ ]
  );
in

assert lib.asserts.assertMsg (
  (args.installPhase or "") == ""
) "buildPgrxExtensions overwrites the installPhase, so providing one does nothing";
assert lib.asserts.assertMsg (
  (args.buildPhase or "") == ""
) "buildPgrxExtensions overwrites the buildPhase, so providing one does nothing";
assert lib.asserts.assertMsg (useFakeRustfmt -> !rustfmtInNativeBuildInputs)
  "The parameter useFakeRustfmt is set to true, but rustfmt is included in nativeBuildInputs. Either set useFakeRustfmt to false or remove rustfmt from nativeBuildInputs.";
assert lib.asserts.assertMsg (!useFakeRustfmt -> rustfmtInNativeBuildInputs)
  "The parameter useFakeRustfmt is set to false, but rustfmt is not included in nativeBuildInputs. Either set useFakeRustfmt to true or add rustfmt from nativeBuildInputs.";

let
  fakeRustfmt = writeShellScriptBin "rustfmt" ''
    exit 0
  '';

  # Rustc wrapper for pgrx < 0.12.0 to filter out empty postmaster_stub.rs arguments
  # This fixes an issue that causes build failures.
  # Fixed upstream in pgcentralfoundation/pgrx#1435 and #1441, available from pgrx >= 0.12.
  rustcWrapper = writeShellScriptBin "rustc" ''
    # ORIGINAL_RUSTC is set in the buildPhase before this wrapper is added to PATH
    original_rustc="''${ORIGINAL_RUSTC:-rustc}"
    filtered_args=()
    for arg in "$@"; do
      if [[ -z "$arg" ]]; then
        continue
      fi
      if [[ "$arg" =~ postmaster_stub\.rs$ ]]; then
        if [[ ! -s "$arg" ]]; then
          continue
        fi
      fi
      filtered_args+=("$arg")
    done
    exec "$original_rustc" "''${filtered_args[@]}"
  '';
  maybeDebugFlag = lib.optionalString (buildType != "release") "--debug";
  maybeEnterBuildAndTestSubdir = lib.optionalString (buildAndTestSubdir != null) ''
    export CARGO_TARGET_DIR="$(pwd)/target"
    pushd "${buildAndTestSubdir}"
  '';
  maybeLeaveBuildAndTestSubdir = lib.optionalString (buildAndTestSubdir != null) "popd";
  pgrxBinaryName = if builtins.compareVersions "0.7.4" cargo-pgrx.version >= 0 then "pgx" else "pgrx";

  # The rustc wrapper is only needed for pgrx < 0.12.0
  # fixed upstream in pgcentralfoundation/pgrx#1435 and #1441
  needsRustcWrapper = builtins.compareVersions cargo-pgrx.version "0.12.0" < 0;

  pgrxPostgresMajor = lib.versions.major postgresql.version;
  preBuildAndTest = ''
    export PGRX_HOME=$(mktemp -d)
    export PGX_HOME=$PGRX_HOME
    export PGDATA="$PGRX_HOME/data-${pgrxPostgresMajor}/"
    cargo-${pgrxBinaryName} ${pgrxBinaryName} init "--pg${pgrxPostgresMajor}" ${lib.getDev postgresql}/bin/pg_config

    # unix sockets work in sandbox, too.
    export PGHOST="$(mktemp -d)"
    cat > "$PGDATA/postgresql.conf" <<EOF
    listen_addresses = '''
    unix_socket_directories = '$PGHOST'
    EOF

    # This is primarily for Mac or other Nix systems that don't use the nixbld user.
    export USER="$(whoami)"
    pg_ctl start
    createuser -h localhost --superuser --createdb "$USER" || true
    pg_ctl stop
  '';

  argsForBuildRustPackage = builtins.removeAttrs args [
    "postgresql"
    "useFakeRustfmt"
    "usePgTestCheckFeature"
  ];

  # so we don't accidentally `(rustPlatform.buildRustPackage argsForBuildRustPackage) // { ... }` because
  # we forgot parentheses
  finalArgs = argsForBuildRustPackage // {
    buildInputs = (args.buildInputs or [ ]);

    nativeBuildInputs =
      (args.nativeBuildInputs or [ ])
      ++ [
        cargo-pgrx
        postgresql
        pkg-config
        bindgenHook
      ]
      ++ lib.optionals useFakeRustfmt [ fakeRustfmt ];

    buildPhase = ''
      runHook preBuild

      echo "Executing cargo-pgrx buildPhase"
      ${preBuildAndTest}
      ${maybeEnterBuildAndTestSubdir}

      export PGRX_BUILD_FLAGS="--frozen -j $NIX_BUILD_CORES ${builtins.concatStringsSep " " cargoBuildFlags}"
      export PGX_BUILD_FLAGS="$PGRX_BUILD_FLAGS"

      ${lib.optionalString needsRustcWrapper ''
        export ORIGINAL_RUSTC="$(command -v ${stdenv.cc.targetPrefix}rustc || command -v rustc)"
        export PATH="${rustcWrapper}/bin:$PATH"
        export RUSTC="${rustcWrapper}/bin/rustc"
      ''}

      ${lib.optionalString stdenv.hostPlatform.isDarwin ''RUSTFLAGS="''${RUSTFLAGS:+''${RUSTFLAGS} }-Clink-args=-Wl,-undefined,dynamic_lookup"''} \
      cargo ${pgrxBinaryName} package \
        --pg-config ${lib.getDev postgresql}/bin/pg_config \
        ${maybeDebugFlag} \
        --features "${builtins.concatStringsSep " " buildFeatures}" \
        --out-dir "$out"

      ${maybeLeaveBuildAndTestSubdir}

      runHook postBuild
    '';

    preCheck = preBuildAndTest + args.preCheck or "";

    installPhase = ''
      runHook preInstall

      echo "Executing buildPgrxExtension install"

      ${maybeEnterBuildAndTestSubdir}

      cargo-${pgrxBinaryName} ${pgrxBinaryName} stop all

      mv $out/${postgresql}/* $out
      mv $out/${postgresql.lib}/* $out
      rm -rf $out/nix

      ${maybeLeaveBuildAndTestSubdir}

      runHook postInstall
    '';

    PGRX_PG_SYS_SKIP_BINDING_REWRITE = "1";
    CARGO_BUILD_INCREMENTAL = "false";
    RUST_BACKTRACE = "full";

    checkNoDefaultFeatures = true;
    checkFeatures =
      (args.checkFeatures or [ ])
      ++ (lib.optionals usePgTestCheckFeature [ "pg_test" ])
      ++ [ "pg${pgrxPostgresMajor}" ];
  };
in
rustPlatform.buildRustPackage finalArgs
