{
  lib,
  pkgs,
  fetchCrate,
  openssl,
  pkg-config,
  makeRustPlatform,
  stdenv,
  rust-bin,
  rustVersion ? "1.85.1",
}:
let
  # TODO: remove once nixpkgs is bumped past NixOS/nixpkgs#512735
  rustPlatform = import ./fix-cargo.nix { inherit pkgs; } (makeRustPlatform {
    cargo = rust-bin.stable.${rustVersion}.default;
    rustc = rust-bin.stable.${rustVersion}.default;
  });
in
{
  mkCargoPgrx =
    {
      version,
      hash,
      cargoHash,
    }:
    let
      pname = if builtins.compareVersions "0.7.4" version >= 0 then "cargo-pgx" else "cargo-pgrx";
    in
    rustPlatform.buildRustPackage rec {
      # rust-overlay uses 'cargo-auditable' wrapper for 'cargo' command, but it
      # is using older version 0.18.1 of 'cargo_metadata' which doesn't support
      # rust edition 2024, so we disable the 'cargo-auditable' just for now.
      # ref: https://github.com/oxalica/rust-overlay/issues/153
      auditable = false;
      inherit pname;
      inherit version;
      # TODO: remove once nixpkgs is bumped past NixOS/nixpkgs#512735
      src = fetchCrate {
        inherit version pname hash;
        registryDl = "https://static.crates.io/crates";
      };
      inherit cargoHash;
      nativeBuildInputs = lib.optionals stdenv.hostPlatform.isLinux [ pkg-config ];
      buildInputs = lib.optionals stdenv.hostPlatform.isLinux [ openssl ];

      OPENSSL_DIR = "${openssl.dev}";
      OPENSSL_INCLUDE_DIR = "${openssl.dev}/include";
      OPENSSL_LIB_DIR = "${openssl.out}/lib";
      PKG_CONFIG_PATH = "${openssl.dev}/lib/pkgconfig";
      preCheck = ''
        export PGRX_HOME=$(mktemp -d)
      '';
      checkFlags = [
        # requires pgrx to be properly initialized with cargo pgrx init
        "--skip=command::schema::tests::test_parse_managed_postmasters"
        "--skip=object_utils::tests::parses_managed_postmasters"
        # require test fixtures not included in the crates.io source tarball
        "--skip=command::upgrade::tests::find_package_manifest_in_workspace"
        "--skip=command::upgrade::tests::process_workspace_manifest"
        "--skip=command::upgrade::tests::process_workspace_package_manifest"
      ];
      meta = with lib; {
        description = "Build Postgres Extensions with Rust";
        homepage = "https://github.com/pgcentralfoundation/pgrx";
        changelog = "https://github.com/pgcentralfoundation/pgrx/releases/tag/v${version}";
        license = licenses.mit;
        mainProgram = "cargo-pgrx";
      };
    };
}
